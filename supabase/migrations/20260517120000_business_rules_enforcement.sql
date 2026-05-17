-- Atomic vote, participation eligibility, audit immutability, election lifecycle

DROP TRIGGER IF EXISTS trg_log_vote_cast ON anonymous_vote;

CREATE OR REPLACE FUNCTION enforce_participation_eligibility()
RETURNS TRIGGER
AS $$
DECLARE
    elig RECORD;
BEGIN
    SELECT * INTO elig
    FROM check_voter_eligibility(NEW.voter_id, NEW.election_id)
    LIMIT 1;

    IF NOT elig.is_eligible THEN
        RAISE EXCEPTION '%', elig.reason;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participation_eligibility ON participation;
CREATE TRIGGER trg_participation_eligibility
BEFORE INSERT ON participation
FOR EACH ROW
EXECUTE FUNCTION enforce_participation_eligibility();

CREATE OR REPLACE FUNCTION cast_vote(
    p_voter_id CHAR(13),
    p_election_id INTEGER,
    p_candidate_id INTEGER
) RETURNS INTEGER
AS $$
DECLARE
    v_receipt_id INTEGER;
    elig RECORD;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM candidate
        WHERE candidate_id = p_candidate_id AND election_id = p_election_id
    ) THEN
        RAISE EXCEPTION 'Candidate does not belong to this election';
    END IF;

    SELECT * INTO elig
    FROM check_voter_eligibility(p_voter_id, p_election_id)
    LIMIT 1;

    IF NOT elig.is_eligible THEN
        RAISE EXCEPTION '%', elig.reason;
    END IF;

    INSERT INTO participation (voter_id, election_id)
    VALUES (p_voter_id, p_election_id);

    INSERT INTO anonymous_vote (candidate_id, election_id)
    VALUES (p_candidate_id, p_election_id)
    RETURNING vote_receipt_id INTO v_receipt_id;

    INSERT INTO audit_log (voter_id, action, log_time)
    VALUES (
        p_voter_id,
        'Vote cast in election ID: ' || p_election_id,
        CURRENT_TIMESTAMP
    );

    RETURN v_receipt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cast_vote(CHAR(13), INTEGER, INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER
AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON audit_log;
CREATE TRIGGER trg_audit_log_no_update
BEFORE UPDATE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER trg_audit_log_no_delete
BEFORE DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE OR REPLACE FUNCTION enforce_voter_id_valid()
RETURNS TRIGGER
AS $$
DECLARE
    parsed RECORD;
BEGIN
    SELECT * INTO parsed FROM parse_sa_id(NEW.voter_id) LIMIT 1;

    IF NOT parsed.valid THEN
        RAISE EXCEPTION '%', parsed.error_message;
    END IF;

    IF parsed.age < 18 THEN
        RAISE EXCEPTION 'Voter must be at least 18 years old';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_voter_id_valid ON voter;
CREATE TRIGGER trg_voter_id_valid
BEFORE INSERT OR UPDATE OF voter_id ON voter
FOR EACH ROW
EXECUTE FUNCTION enforce_voter_id_valid();

CREATE OR REPLACE FUNCTION manage_election_status_transitions()
RETURNS TRIGGER
AS $$
BEGIN
    IF NEW.status = 'Active' AND OLD.status IS DISTINCT FROM 'Active' THEN
        IF NOT EXISTS (
            SELECT 1 FROM candidate WHERE election_id = NEW.election_id
        ) THEN
            RAISE EXCEPTION 'Election must have at least one candidate before becoming Active';
        END IF;
        NEW.result_locked := TRUE;
    END IF;

    IF NEW.status = 'Closed' AND OLD.status IS DISTINCT FROM 'Closed' THEN
        NEW.result_locked := FALSE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_election_status_transitions ON election;
CREATE TRIGGER trg_election_status_transitions
BEFORE UPDATE OF status, result_locked ON election
FOR EACH ROW
EXECUTE FUNCTION manage_election_status_transitions();

ALTER TABLE election DISABLE TRIGGER trg_prevent_election_update;

CREATE OR REPLACE FUNCTION prevent_election_update()
RETURNS TRIGGER
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF OLD.status = 'Closed' AND NEW.status <> 'Closed' THEN
            RAISE EXCEPTION
            'Closed elections cannot be reopened';
        END IF;

        RETURN NEW;
    END IF;

    IF OLD.status = 'Closed' THEN
        RAISE EXCEPTION
        'Closed elections cannot be modified';
    END IF;

    IF OLD.status = 'Active'
       OR CURRENT_TIMESTAMP >= OLD.start_date THEN
        RAISE EXCEPTION
        'Election details cannot be modified after voting has started';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_election_active()
RETURNS TRIGGER
AS $$
DECLARE
    election_record RECORD;
BEGIN
    SELECT *
    INTO election_record
    FROM election
    WHERE election_id = NEW.election_id;

    IF election_record IS NULL THEN
        RAISE EXCEPTION 'Election does not exist';
    END IF;

    IF election_record.status <> 'Active' THEN
        RAISE EXCEPTION 'Election is not active';
    END IF;

    IF CURRENT_TIMESTAMP < election_record.start_date
       OR CURRENT_TIMESTAMP > election_record.end_date THEN
        RAISE EXCEPTION 'Voting is outside election period';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE election
SET result_locked = FALSE
WHERE status = 'Active';

ALTER TABLE election ENABLE TRIGGER trg_prevent_election_update;

SELECT election_id, election_name, status, result_locked
FROM election
ORDER BY election_id;

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS anonymous_vote CASCADE;
DROP TABLE IF EXISTS participation CASCADE;
DROP TABLE IF EXISTS candidate CASCADE;
DROP TABLE IF EXISTS party CASCADE;
DROP TABLE IF EXISTS election CASCADE;
DROP TABLE IF EXISTS admin_user CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS voter CASCADE;

CREATE TABLE voter (
    voter_id CHAR(13) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    race VARCHAR(50),
    password_hash TEXT NOT NULL,
    voter_status VARCHAR(20) NOT NULL
        CHECK (voter_status IN ('active', 'inactive', 'suspended')),
    qualification_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sa_id_format
        CHECK (voter_id ~ '^[0-9]{13}$')
);

CREATE TABLE election (
    election_id SERIAL PRIMARY KEY,
    election_name VARCHAR(150) NOT NULL,
    election_type VARCHAR(100) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Upcoming', 'Active', 'Closed')),
    result_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_election_dates
        CHECK (end_date > start_date)
);

CREATE TABLE party (
    party_id SERIAL PRIMARY KEY,
    party_name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE candidate (
    candidate_id SERIAL PRIMARY KEY,
    candidate_name VARCHAR(150) NOT NULL,
    party_id INTEGER NOT NULL,
    election_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate_party
        FOREIGN KEY (party_id)
        REFERENCES party(party_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_candidate_election
        FOREIGN KEY (election_id)
        REFERENCES election(election_id)
        ON DELETE CASCADE
);

CREATE TABLE participation (
    participation_id SERIAL PRIMARY KEY,
    voter_id CHAR(13) NOT NULL,
    election_id INTEGER NOT NULL,
    participation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_participation_voter
        FOREIGN KEY (voter_id)
        REFERENCES voter(voter_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_participation_election
        FOREIGN KEY (election_id)
        REFERENCES election(election_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_voter_election
        UNIQUE (voter_id, election_id)
);

CREATE TABLE anonymous_vote (
    vote_receipt_id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL,
    election_id INTEGER NOT NULL,
    vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vote_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidate(candidate_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_vote_election
        FOREIGN KEY (election_id)
        REFERENCES election(election_id)
        ON DELETE CASCADE
);

CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE admin_user (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_user_role
        FOREIGN KEY (role_id)
        REFERENCES role(role_id)
        ON DELETE RESTRICT
);

CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NULL,
    voter_id CHAR(13) NULL,
    action TEXT NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES admin_user(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_voter
        FOREIGN KEY (voter_id)
        REFERENCES voter(voter_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_candidate_election
ON candidate(election_id);

CREATE INDEX idx_participation_voter
ON participation(voter_id);

CREATE INDEX idx_participation_election
ON participation(election_id);

CREATE INDEX idx_vote_candidate
ON anonymous_vote(candidate_id);

CREATE INDEX idx_vote_election
ON anonymous_vote(election_id);

CREATE INDEX idx_audit_user
ON audit_log(user_id);

CREATE INDEX idx_audit_voter
ON audit_log(voter_id);

INSERT INTO role (role_id, role_name)
VALUES
(1, 'System Administrator'),
(2, 'Election Administrator'),
(3, 'IT Support Team'),
(4, 'Auditor');

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

CREATE TRIGGER trg_check_election_active
BEFORE INSERT ON anonymous_vote
FOR EACH ROW
EXECUTE FUNCTION check_election_active();

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

CREATE TRIGGER trg_prevent_election_update
BEFORE UPDATE ON election
FOR EACH ROW
EXECUTE FUNCTION prevent_election_update();

CREATE VIEW election_results AS
SELECT
    e.election_id,
    e.election_name,
    c.candidate_id,
    c.candidate_name,
    p.party_name,
    COUNT(av.vote_receipt_id) AS total_votes
FROM anonymous_vote av
JOIN candidate c
    ON av.candidate_id = c.candidate_id
JOIN party p
    ON c.party_id = p.party_id
JOIN election e
    ON av.election_id = e.election_id
GROUP BY
    e.election_id,
    e.election_name,
    c.candidate_id,
    c.candidate_name,
    p.party_name
ORDER BY total_votes DESC;


CREATE INDEX idx_election_status ON election(status, result_locked);
CREATE INDEX idx_election_dates ON election(start_date, end_date);
CREATE INDEX idx_voter_status ON voter(voter_status, qualification_status);
CREATE INDEX idx_audit_log_time ON audit_log(log_time DESC);
CREATE INDEX idx_system_user_role ON admin_user(role_id);


CREATE OR REPLACE FUNCTION log_user_action(
    p_user_id INTEGER,
    p_voter_id CHAR(13),
    p_action TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (user_id, voter_id, action, log_time)
    VALUES (p_user_id, p_voter_id, p_action, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION log_vote_cast()
RETURNS TRIGGER AS $$
DECLARE
    v_voter_id CHAR(13);
BEGIN
    
    SELECT voter_id INTO v_voter_id
    FROM participation
    WHERE election_id = NEW.election_id
    ORDER BY participation_time DESC
    LIMIT 1;

    
    INSERT INTO audit_log (voter_id, action, log_time)
    VALUES (
        v_voter_id,
        'Vote cast in election ID: ' || NEW.election_id,
        CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_vote_cast
AFTER INSERT ON anonymous_vote
FOR EACH ROW
EXECUTE FUNCTION log_vote_cast();


CREATE OR REPLACE FUNCTION check_voter_eligibility(
    p_voter_id CHAR(13),
    p_election_id INTEGER
) RETURNS TABLE (
    is_eligible BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    v_voter RECORD;
    v_election RECORD;
    v_already_voted BOOLEAN;
BEGIN
    
    SELECT * INTO v_voter
    FROM voter
    WHERE voter_id = p_voter_id;

    IF v_voter IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Voter not found';
        RETURN;
    END IF;

    IF v_voter.voter_status != 'active' THEN
        RETURN QUERY SELECT FALSE, 'Voter account is not active';
        RETURN;
    END IF;

    IF v_voter.qualification_status = FALSE THEN
        RETURN QUERY SELECT FALSE, 'Voter is not qualified';
        RETURN;
    END IF;

    
    SELECT * INTO v_election
    FROM election
    WHERE election_id = p_election_id;

    IF v_election IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Election not found';
        RETURN;
    END IF;

    IF v_election.status != 'Active' THEN
        RETURN QUERY SELECT FALSE, 'Election is not active';
        RETURN;
    END IF;

    IF CURRENT_TIMESTAMP < v_election.start_date OR 
       CURRENT_TIMESTAMP > v_election.end_date THEN
        RETURN QUERY SELECT FALSE, 'Outside voting period';
        RETURN;
    END IF;

    
    SELECT EXISTS(
        SELECT 1 FROM participation
        WHERE voter_id = p_voter_id AND election_id = p_election_id
    ) INTO v_already_voted;

    IF v_already_voted THEN
        RETURN QUERY SELECT FALSE, 'Already voted in this election';
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'Eligible to vote';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION luhn_check_digit(id12 TEXT)
RETURNS INTEGER AS $$
DECLARE
    i INTEGER;
    total INTEGER := 0;
    digit_val INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        digit_val := CAST(substring(id12, 13 - i, 1) AS INTEGER);
        IF i % 2 = 0 THEN
            digit_val := digit_val * 2;
            IF digit_val > 9 THEN
                digit_val := (digit_val / 10) + (digit_val % 10);
            END IF;
        END IF;
        total := total + digit_val;
    END LOOP;
    RETURN (10 - (total % 10)) % 10;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION parse_sa_id(p_id CHAR(13))
RETURNS TABLE (
    valid BOOLEAN,
    birth_date DATE,
    age INTEGER,
    gender VARCHAR(10),
    citizenship VARCHAR(30),
    error_message TEXT
) AS $$
DECLARE
    id_str TEXT;
    id12 TEXT;
    provided_check INTEGER;
    expected_check INTEGER;
    yymmdd TEXT;
    yy INTEGER;
    mm INTEGER;
    dd INTEGER;
    birth_year INTEGER;
    current_year INTEGER;
    seq_part TEXT;
    seq INTEGER;
    citizen_digit CHAR(1);
    birth_date_calc DATE;
    age_calc INTEGER;
    gender_calc VARCHAR(10);
    citizenship_calc VARCHAR(30);
BEGIN
    valid := FALSE;
    birth_date := NULL;
    age := NULL;
    gender := NULL;
    citizenship := NULL;
    error_message := NULL;

    id_str := trim(p_id);
    IF length(id_str) != 13 THEN
        error_message := 'ID number must be exactly 13 digits';
        RETURN NEXT;
        RETURN;
    END IF;

    IF id_str !~ '^[0-9]{13}$' THEN
        error_message := 'ID number contains non-digit characters';
        RETURN NEXT;
        RETURN;
    END IF;

    id12 := left(id_str, 12);
    provided_check := CAST(right(id_str, 1) AS INTEGER);
    expected_check := luhn_check_digit(id12);
    IF provided_check != expected_check THEN
        error_message := format('Invalid check digit: expected %s, got %s', expected_check, provided_check);
        RETURN NEXT;
        RETURN;
    END IF;

    yymmdd := substring(id_str, 1, 6);
    seq_part := substring(id_str, 7, 4);
    citizen_digit := substring(id_str, 11, 1);

    yy := CAST(substring(yymmdd, 1, 2) AS INTEGER);
    mm := CAST(substring(yymmdd, 3, 2) AS INTEGER);
    dd := CAST(substring(yymmdd, 5, 2) AS INTEGER);

    IF mm < 1 OR mm > 12 OR dd < 1 OR dd > 31 THEN
        error_message := 'Invalid month or day in birth date';
        RETURN NEXT;
        RETURN;
    END IF;

    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    birth_year := 1900 + yy;
    IF birth_year + 100 <= current_year THEN
        birth_year := 2000 + yy;
    END IF;
    IF birth_year > current_year THEN
        birth_year := 1900 + yy;
    END IF;

    BEGIN
        birth_date_calc := make_date(birth_year, mm, dd);
        IF birth_date_calc > CURRENT_DATE THEN
            error_message := 'Birth date cannot be in the future';
            RETURN NEXT;
            RETURN;
        END IF;
    EXCEPTION WHEN others THEN
        error_message := 'Invalid date in ID number (e.g., 31st of February)';
        RETURN NEXT;
        RETURN;
    END;

    age_calc := EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date_calc));

    seq := CAST(seq_part AS INTEGER);
    IF seq BETWEEN 0 AND 4999 THEN
        gender_calc := 'Female';
    ELSIF seq BETWEEN 5000 AND 9999 THEN
        gender_calc := 'Male';
    ELSE
        error_message := format('Invalid gender sequence %s (must be 0000-9999)', seq_part);
        RETURN NEXT;
        RETURN;
    END IF;

    IF citizen_digit = '0' THEN
        citizenship_calc := 'South African Citizen';
    ELSIF citizen_digit = '1' THEN
        citizenship_calc := 'Permanent Resident';
    ELSIF citizen_digit = '2' THEN
        citizenship_calc := 'Refugee';
    ELSE
        error_message := format('Invalid citizenship digit %s (must be 0,1,2)', citizen_digit);
        RETURN NEXT;
        RETURN;
    END IF;

    valid := TRUE;
    birth_date := birth_date_calc;
    age := age_calc;
    gender := gender_calc;
    citizenship := citizenship_calc;
    error_message := NULL;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE STRICT;

-- ============================================
-- COMPLETE POSTGRESQL SCHEMA FOR HEALTH SYSTEM
-- ============================================
-- This schema replaces all MongoDB collections with PostgreSQL tables

-- Drop existing tables if needed (use with caution)
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS queue_settings CASCADE;
DROP TABLE IF EXISTS medical_knowledge CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS hospital_tieup_doctors CASCADE;
DROP TABLE IF EXISTS hospital_tieups CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS saved_profiles CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    image TEXT DEFAULT 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA5uSURBVHgB7d0JchvHFcbxN+C+iaQolmzFsaWqHMA5QXID+wZJTmDnBLZu4BvER4hvYJ/AvoHlimPZRUngvoAg4PkwGJOiuGCd6df9/1UhoJZYJIBvXndPL5ndofljd8NW7bP8y79bZk+tmz8ATFdmu3nWfuiYfdNo2383389e3P5Xb9B82X1qs/YfU3AB1Cuzr+3cnt8U5Mb132i+7n5mc/a9EV4gDF37Z15Qv3/9a/fz63/0VgXOw/uFdexLAxCqLze3s+flL/4IcK/yduwrAxC0zoX9e+u9rJfVXoB7fV41m7u2YQBCt2tt+6v6xEUfeM6+ILyAGxv9QWbL+iPOPxoAX2Zts9GZtU8NgDudln3eyNvQnxgAd/Lw/k194I8NgD+ZPc2aO92uAXCpYQDcIsCAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGMEGHCMAAOOEWDAMQIMOEaAAccIMOAYAQYcI8CAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGMEGHCMAAOOEWDAMQIMOEaAAccIMOAYAQYcI8CAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGOzBlfanfzRNrvo5o8Ls46eO8VDut3i966babz7rMfcjFmWP8/rOTM4Q4ADpjCenZu18sCe52FtX9wczkGUAS+fb6IwK9Tzc/kHI/96gU9H8HiLAnOWh/WsZXZ6fnfYpkEXCT30b0sjr8jz+SdkYb4I8gwdruAQ4AAotCdnRbUdtcJOg74XhbkMtCr08iJhDgkBrkmv0uWV9vgsrNDeRd/z3lHxtSrz0kIe6HlDjQhwxVRtD0+Kfq1n+v5b/Z9lKQ/x8gJVuQ5Zc6fr5PrvWyzBvYuCvLZEkKtEBZ6yFIJbOmkVD4JcHQI8JSkF9zqFWANyalYryJoeAjxh6pAc5ME9OrOkaWDu8LQI8+oSg13TQoAnSKPKe8d+RpWroHvZGrlundOsngYCPAGqurtHl/dL8S5VYnUnqMaTRYDHpL6uKkzVs6Y8Kqux5nKrGjP3enwEeAwHp8VAFYaj8QG1VrbWaFKPi5dvBGoyvz4gvONQNX61X4wbYHQEeEj64O3sp3l7aNI02Nc8KkbtMRqa0EPQXODmIf3dSdPtJrVqHiwbhkQFHpDC++aA8E6L+sW7R4YhUYEHcNy6XIWD6dGtJm1aoMEtRqgHQwW+B+Gtllo6GiBkic1gCPAdrq5/RXX0utOcHgwBvkXZ50U9dJ+YEN+PAN9AA1UabWZOc73UJ+YW090I8DXlJA1Gm8OgW0xHp4ZbEOBrdpnXHJz9RNdVD4IAX6G5zawoChMX1psR4L5yBw2ESeFlUOtdBNgul7khbGpG0x9+GwG2YqST5pkP6g9rthYKyQdYG6ufsKTNFZrSl5IOsKruIU0ydzTJhvvDhaQDTNPZL7WceO8SDrDefJrOfnW6NKUl2eWEmioZi0b/TN/FhfwN7Z8c2Ji5/PPz/qmHZ6f9s4Yjudddns80n/Ci2CR/dDW/zp2PZCq0G+tmaytFcBtDtKUU4OO8+7C3n9+Wcd6XVDdI64dTlWSAPQ9cKahbm2YPN4YL7VVzebVe1+NBEeadN0WYPUq9Cid3OqGqr05P8OhhHtzth6MH9y4KsILssXmt8KZahZMbxPJafR9v549H0wmvqBp/9KeiOntTVuEUJRVgzXf2eOtB4VWTedoU3mcf+gxxqveFkwqwx8UKj7aqCW9JI9iqxA1nn4xUq3AyAVbl9fYGqxKqz1vHv/vkPXMnxYUOyQTYYxPryWOrjW5PrTg7nFsX6NR2s0wmwN6q7/JS8aiTmu+eaLLKcWIHqycRYI+DVxsPrHa6gHjrC6e2o0oSAfZYhTceWO10AXG3o0oSAT5xeFVeDuScoBAuJMNoOb3TMKo0KrCzq/LCQj6QFMjMolAuJMNI6cjS6AOs5rO3/Z1Dmha4OG/upNSMjj/ADq/GqsCh0C0lj/eEUxmNjj7AHm/uhzYTambG3EllrXfUAdZghsdlgzNsNTi2VDa+i/qjcs5u/hPhcaleKtMqow6w1zcxtNsgHl9HtbxS6AfHXYGdNqM6gX3fF05fR++7rgwi6gB77QeF1PRXa6DjdGJECl2oaAOsq6/X831D2hXjzPHcYiqwY54P5z4OaOXUqeMleimMREcbYM9vnpqtoYT40PHeyynMiY42wF4HXkpHAWy8p6a8521n1QqLfSQ63gA7v/o2d6123veMFs9dqUHQBw5U70DrmvdqfvXG3Iu9GR1tgGNoOtUZIF08YjiCJfaBLCpwwBSgN02rnO77xlB9U0AFDpyCVPWEhJ3X8RyAxiCWU7EMXqgP9/Mv1c2GUsV/E8AA2qQwiIXanZ6Z/bpjU6d/57dXBkcSPlnVl/L0wGntFa2JI//7xeAMAXZEIdbc5A+eTHbTOzWbqbw+0YR2Rs3cn36ezD1iDVTpv0V4/Yq2Amtbmlhv4it4L38rRqgfPRx+72YNiL3uD1Z5XSo4qNi3J6IJ7djVIOsUhbXVYvub67taKqT6u4fHxeKEkFY7YTzRBriR5RXY0qBw7p1fDnRJubOlFnXEXmXvMutwR81hRN2ETmFB921imYiBu0XbQ8gyA6LvA0f947G3MoQAO0WAMRd5/1ei/ZiHcrof6pNCNyrqQayUXD1P6aaTFMrN2VMalU6hAkd9GymmyRwKqI76nMsfC/PFgWOLC8XPOMrpgVqiqJHq3vlRrWLE/uw0jm10SguBHRI3DVE3NFWJvJ5Sp8BqYoYmaKwsTf6IT3Ux/uhmrLz9Z5queXxcTPg4cLwrZQqtsKgDPOcswArp1qbZ+oN6+/Cq7Ho83Cx+rRDv7fkKs1pgsU/ikOgrsAeqsttbxXOI1laKR2+LHwX5MPyJIimEV+KuwDPFlTjUXRlU5R5vhxvc69Ssf/wor8zrRZDr2K9rUIsJ9H8l+pstuhKHeDymKq5WEnl0Ncg//T/MapzCAJZE383XyG1I9OF/9qHf8F6ln+UvTy/7yqHQ4FUqTejoA7wUUID1gf/og6LpHBNVY7UoQuFl7GMSog+w+sAhvKFleGOdIaYWRSghDumiPW1JzFeaD6A/FHN4Swrx+pC7g0yams+p9H8liQCv1NxkfbSVztxsjarP1RiglJrPkkSA62xG68O8HcGA1aBUAev8eZcjG1+4TzJT/lcWrRYphbfUm0lWQxXWxYMKHCm9sY2Kl5fpA1V3n7AuG2tWuTUnE2ImKZkAK7zLFVdhLzOspqHqC1eK1VeSWjWrwawqq3DKAVYTulHhp0vhTXEXlqR+5KqrcOynw9+l6k0DUmw+S3LXrCqrsDZc11m7qSmPbKkqxJq4keoeaMn1GsoqfFjRzhMKsdbR/vlJ/PeC6zqyJdXqK1lzJ/YzzN+l5YU7e9UvM1SfWIM7G5GNTNd51pJaVA+WLVlJBlgOTqurwtdpgKc8y2ga2+VUQcec7h8W2+7UddaSms1ba2lvIZxsgFV9X+2HMdCk1Uk6kEyb1S0tFr8OKdTaAE/7ZLVaZicnxcZ3IexsubGS1sKFmyS7e7L6wvoAvD6w2ikcelylACvIWogxO1v8er4/WNPbiXJm/D61QqgLWOeieG6dF9vOti/6O1W2i98LcRtavQaph1eS3v5c9w619cppgDtKKDTDNE8HnboYy77QWzXM9ApR8ucXrOdVuFXDgNakpXQa4dryR+eUkn8Z1JReXzE4oeCuJnzb6DquY1Y0o+teM4z76WJL0/ltBLhPV3WaZWHjPXoXL0dfeXWveskhBqMWEq2kdxHgK3R1T3lWT6i0QT/vy80I8DW6t5jy3NrQ6KK6uWq4BQG+weoizbUQlN0a+r2346W5hZpszPSpj8L7kPDei5fnDppqmcIp7yFa57UfCAG+h6oAH6Rq6cKZyumC4yLA9yibcnygpk+vtQas6LoMjgAPgA/W9HGhHA0BHoKadtximjwNVD16QFdlFMmvRhqWbjFlebXYPzZMgEKr1g2jzaMhwCPQPWKtJW4epr117Lj0OqpFkzF9dWRc90akyqFJBimeBjAu9Xd1n10PwjseAjyGclM1+sWD04VP/V1muk0G9WMC1C/WCLX216JJfTtd6FZrOiUyVsnuSjkth6dmBzVtsxoqhSgGh1tMB50vbTak1qxXeFWtaS5PDwGeAvWNe9MB54vbTak1qxXclf6KLgapposAT5FmFS2uF5VYFTn2IBPc6hHgCqhJrYeCfKwTDtoWFYJbHwJcoTLICrCC7L2PrEEpdRMIbn0IcA00KquHbquUYfZSlVVtdRFScJnEUj/eghqV5/voof6xjng5bYUX5quhVdWl2oaD+8AB0jty1i7C3Dto7MIqpcD2WglzRWCptOHirQmQKlxvBLu/NlaBPu8HuXdaYLcI9iTOc1IrQCEtnxVaVgb5QQV2TO9cu1M8K8xdHRVqN58+ONsPZVYeT5oR1BhQgR1TpWZ6Ytq4BgOOEWDAMQIMOEaAAccIMOAYAQYcI8CAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGMEGHCMAAOOEWDAMQIMOEaAAccIMOAYAQYcI8CAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDjWsMxeGACPdhvWJcCAUz80OmbfGQB3Ohf2TdZsdjesbU0D4EvbnjU2N7Pd/MtvDYAfmX29+X72ohiFbtu/8v/dNQAe7Nq5PdcXvQAryfnTcwPgwfN+Zi/vA29uZ18ZIQbC1snDW2S1J7v+582d7uf50xf5Y8MAhEJd3LfCK9lNf7P5svu0M2NfNjL7hwGo27capyqbzVdld/2/FGSbtU/zLz/JHx8bVRmYPs2OLCZYfWeH9tXms+zWAebfASz7TK2tFnyYAAAAAElFTkSuQmCC',
    phone VARCHAR(20) DEFAULT '000000000',
    address_line1 VARCHAR(255) DEFAULT '',
    address_line2 VARCHAR(255) DEFAULT '',
    gender VARCHAR(50) DEFAULT 'Not Selected',
    dob VARCHAR(50) DEFAULT 'Not Selected',
    age INTEGER DEFAULT NULL,
    blood_group VARCHAR(10) DEFAULT '',
    role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
    password VARCHAR(255) NOT NULL,
    reset_password_otp VARCHAR(10),
    reset_password_otp_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Contacts (Friends and Family)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relation VARCHAR(100) NOT NULL,
    contact_type VARCHAR(20) CHECK (contact_type IN ('friend', 'family')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Profiles (for booking appointments for others)
CREATE TABLE IF NOT EXISTS saved_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age VARCHAR(10) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    medical_history TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_profiles_user_id ON saved_profiles(user_id);

-- ============================================
-- 2. ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. SPECIALTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS specialties (
    id SERIAL PRIMARY KEY,
    specialty_name VARCHAR(255) UNIQUE NOT NULL,
    helpline_number VARCHAR(20) NOT NULL,
    availability VARCHAR(20) DEFAULT '24x7' CHECK (availability IN ('24x7', 'Working Hours')),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_specialties_name ON specialties(specialty_name);
CREATE INDEX IF NOT EXISTS idx_specialties_status ON specialties(status);

-- ============================================
-- 4. HOSPITALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    image TEXT,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    speciality TEXT[], -- Array of specialties
    about TEXT,
    available BOOLEAN DEFAULT true,
    date BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospitals_email ON hospitals(email);
CREATE INDEX IF NOT EXISTS idx_hospitals_available ON hospitals(available);

-- ============================================
-- 5. DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    speciality VARCHAR(100) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    about TEXT NOT NULL,
    fees DECIMAL(10, 2) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    available BOOLEAN DEFAULT true,
    slots_booked JSONB DEFAULT '{}',
    date BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'in-clinic' CHECK (status IN ('in-clinic', 'in-consult', 'on-break', 'unavailable', 'online')),
    current_appointment_id INTEGER,
    average_consultation_time INTEGER DEFAULT 15,
    break_start_time BIGINT,
    break_duration INTEGER DEFAULT 15,
    video_consult BOOLEAN DEFAULT false,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    hospital VARCHAR(255) DEFAULT '',
    hospital_id INTEGER REFERENCES hospitals(id),
    reset_password_otp VARCHAR(10),
    reset_password_otp_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_speciality ON doctors(speciality);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(available);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors(hospital_id);

-- ============================================
-- 6. HOSPITAL TIE-UPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hospital_tieups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'General',
    show_on_home BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospital_tieup_doctors (
    id SERIAL PRIMARY KEY,
    hospital_tieup_id INTEGER REFERENCES hospital_tieups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    experience INTEGER NOT NULL,
    image TEXT DEFAULT '',
    available BOOLEAN DEFAULT true,
    show_on_hospital_page BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospital_tieup_doctors_hospital_id ON hospital_tieup_doctors(hospital_tieup_id);

-- ============================================
-- 7. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    doctor_id INTEGER REFERENCES doctors(id),
    slot_date VARCHAR(50) NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    user_data JSONB NOT NULL,
    doctor_data JSONB NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    consultation_fee DECIMAL(10, 2) DEFAULT 0,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    gst DECIMAL(10, 2) DEFAULT 0,
    cost_breakdown JSONB,
    date BIGINT NOT NULL,
    cancelled BOOLEAN DEFAULT false,
    payment BOOLEAN DEFAULT false,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    upi_transaction_id VARCHAR(255),
    payer_vpa VARCHAR(255),
    payment_timestamp TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'payOnVisit',
    is_completed BOOLEAN DEFAULT false,
    token_number INTEGER,
    queue_position INTEGER,
    estimated_wait_time INTEGER DEFAULT 0,
    actual_start_time BIGINT,
    actual_end_time BIGINT,
    consultation_duration INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-queue', 'in-consult', 'completed', 'no-show', 'cancelled')),
    is_delayed BOOLEAN DEFAULT false,
    delay_reason TEXT DEFAULT '',
    alerted BOOLEAN DEFAULT false,
    selected_symptoms TEXT[],
    actual_patient_name VARCHAR(255),
    actual_patient_age VARCHAR(10),
    actual_patient_gender VARCHAR(50),
    actual_patient_relationship VARCHAR(100),
    actual_patient_medical_history TEXT[],
    actual_patient_symptoms TEXT,
    actual_patient_phone VARCHAR(20),
    actual_patient_is_self BOOLEAN DEFAULT true,
    recent_prescription TEXT,
    mode VARCHAR(20) DEFAULT 'In-person' CHECK (mode IN ('In-person', 'Video')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot_date ON appointments(slot_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);

-- ============================================
-- 8. HEALTH RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id),
    appointment_id INTEGER REFERENCES appointments(id),
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    attachments TEXT, -- Changed from TEXT[] to TEXT to store JSON string as per model usage
    record_type VARCHAR(50) DEFAULT 'general',
    title VARCHAR(255),
    description TEXT,
    doctor_name VARCHAR(255),
    record_date TIMESTAMP,
    tags TEXT, -- Store as JSON string
    is_important BOOLEAN DEFAULT false,
    uploaded_before_appointment BOOLEAN DEFAULT false,
    viewed_by_doctor BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_doctor_id ON health_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_health_records_appointment_id ON health_records(appointment_id);

-- ============================================
-- 9. CONSULTATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id),
    user_id INTEGER REFERENCES users(id),
    notes TEXT,
    prescription TEXT,
    follow_up_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    type VARCHAR(20) DEFAULT 'video' CHECK (type IN ('video', 'audio', 'chat')),
    meeting_link TEXT,
    meeting_id VARCHAR(255),
    meeting_provider VARCHAR(50) DEFAULT 'google-meet',
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration INTEGER, -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- ============================================
-- 10. JOB APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    position VARCHAR(255) NOT NULL,
    resume_url TEXT,
    cover_letter TEXT,
    city VARCHAR(100),
    qualification VARCHAR(255),
    experience VARCHAR(50),
    skills TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- ============================================
-- 11. CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]',
    last_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_doctor_id ON conversations(doctor_id);

-- ============================================
-- 12. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- 13. QUEUE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS queue_settings (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    avg_consultation_time INTEGER DEFAULT 15,
    max_queue_length INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queue_settings_doctor_id ON queue_settings(doctor_id);

-- ============================================
-- 14. MEDICAL KNOWLEDGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS medical_knowledge (
    id SERIAL PRIMARY KEY,
    symptom VARCHAR(255) NOT NULL,
    conditions JSONB DEFAULT '[]',
    severity VARCHAR(50),
    otc_medicines JSONB DEFAULT '[]',
    precautions JSONB DEFAULT '[]',
    when_to_see_doctor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_knowledge_symptom ON medical_knowledge(symptom);

-- ============================================
-- SAMPLE DATA INSERTS
-- ============================================

-- Insert sample admin
INSERT INTO admins (email, password) VALUES 
('medichain123@gmail.com', 'VHARSHITH121427$$')
ON CONFLICT (email) DO NOTHING;

-- Insert sample specialties
INSERT INTO specialties (specialty_name, helpline_number, availability) VALUES
('General physician', '1800-123-4567', '24x7'),
('Cardiologist', '1800-123-4568', '24x7'),
('Pediatricians', '1800-123-4569', 'Working Hours'),
('Dermatologist', '1800-123-4570', 'Working Hours'),
('Gynecologist', '1800-123-4571', '24x7'),
('Neurologist', '1800-123-4572', '24x7')
ON CONFLICT (specialty_name) DO NOTHING;

-- Insert sample doctors
INSERT INTO doctors (name, email, password, image, speciality, degree, experience, about, fees, address_line1, address_line2, date)
VALUES 
('Dr. Sarah Johnson', 'sarah.johnson@hospital.com', 'password123', '', 'General physician', 'MBBS, MD', '8 Years', 
 'Dr. Sarah Johnson is a dedicated general physician with expertise in preventive care and chronic disease management.', 
 50.00, '123 Medical Center', 'Downtown District', EXTRACT(EPOCH FROM NOW()) * 1000),
('Dr. Michael Chen', 'michael.chen@hospital.com', 'password123', '', 'Cardiologist', 'MBBS, DM Cardiology', '12 Years',
 'Dr. Michael Chen specializes in cardiovascular diseases and interventional cardiology.',
 100.00, '456 Heart Institute', 'Medical Plaza', EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (email) DO NOTHING;

-- Insert sample hospitals
INSERT INTO hospitals (name, email, password, address_line1, address_line2, speciality, about, date)
VALUES 
('City General Hospital', 'info@citygeneralhospital.com', 'hospital123', '100 Main Street', 'City Center',
 ARRAY['General physician', 'Cardiologist', 'Pediatricians'],
 'City General Hospital is a multi-specialty hospital providing comprehensive healthcare services.', EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (email) DO NOTHING;

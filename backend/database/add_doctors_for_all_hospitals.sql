-- Add doctors for hospitals (Simplified)

DO $$ 
DECLARE 
    h_rec RECORD;
    i INT;
    names TEXT[] := ARRAY['Sharma', 'Gupta', 'Patel', 'Singh', 'Reddy', 'Rao', 'Kumar', 'Verma'];
    specialties TEXT[] := ARRAY['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine', 'Gynecology', 'Dermatology'];
BEGIN 
    FOR h_rec IN SELECT id, name FROM hospital_tieups LOOP 
        FOR i IN 1..4 LOOP 
            -- Insert into hospital_tieup_doctors
            INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page)
            VALUES (
                h_rec.id, 
                'Dr. ' || names[1 + floor(random() * array_length(names, 1))::int] || ' ' || names[1 + floor(random() * array_length(names, 1))::int],
                'MBBS, MD',
                specialties[1 + floor(random() * array_length(specialties, 1))::int],
                10 + floor(random() * 20)::int,
                'https://ui-avatars.com/api/?name=Dr&background=random',
                true,
                true
            );

            -- Insert into main doctors table
            INSERT INTO doctors (name, email, password, image, speciality, degree, experience, about, fees, address_line1, address_line2, available, date, hospital_id, hospital)
            VALUES (
                'Dr. ' || names[1 + floor(random() * array_length(names, 1))::int] || ' ' || names[1 + floor(random() * array_length(names, 1))::int],
                'dr_' || h_rec.id || '_' || i || '_' || floor(random()*1000)::text || '@hospital.com',
                '$2a$10$X7.1.1.1.1.1.1.1.1.1.1',
                'https://ui-avatars.com/api/?name=Dr&background=random',
                specialties[1 + floor(random() * array_length(specialties, 1))::int],
                'MBBS, MD',
                (10 + floor(random() * 20)::int) || ' Years',
                'Experienced specialist at ' || h_rec.name,
                500 + floor(random() * 1000)::int,
                'Hospital Address',
                'City',
                true,
                EXTRACT(EPOCH FROM NOW()) * 1000,
                h_rec.id,
                h_rec.name
            );
        END LOOP; 
    END LOOP; 
END $$;

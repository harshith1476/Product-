-- ============================================
-- ADD HOSPITALS TO HOSPITAL TIE-UPS PAGE
-- ============================================

INSERT INTO hospital_tieups (name, address, contact, specialization, type, show_on_home) VALUES

('Apollo Hospitals', 'Film Nagar, Hyderabad - 500096', '+91-40-2360-7777', 'Multi-Specialty', 'Super Specialty', true),
('Yashoda Hospitals', 'Malakpet, Hyderabad - 500036', '+91-40-6868-1111', 'Cardiology, Gastroenterology, Oncology', 'Tertiary Care', true),
('KIMS Hospitals', 'Secunderabad, Hyderabad - 500003', '+91-40-4488-1111', 'Neurology, Cardiology, Oncology', 'Super Specialty', true),
('Care Hospitals', 'Banjara Hills, Hyderabad - 500034', '+91-40-6165-6565', 'Orthopedics, Cardiology, Gastroenterology', 'Multi-Specialty', true),
('Rainbow Childrens Hospital', 'Road No 14, Banjara Hills, Hyderabad - 500034', '+91-40-4455-0000', 'Pediatrics, Neonatology', 'Pediatric Specialty', true),
('Continental Hospitals', 'IT Park Road, Nanakramguda, Hyderabad - 500032', '+91-40-6700-0000', 'Multi-Organ Transplant, Cardiology', 'Super Specialty', true),
('Sunshine Hospitals', 'Gachibowli, Hyderabad - 500032', '+91-40-4455-5566', 'General Medicine, Orthopedics, Gynecology', 'Multi-Specialty', true),
('MaxCure Hospitals', 'Madhapur, Hyderabad - 500081', '+91-40-6677-2222', 'Cardiology, Neurology, Urology', 'Multi-Specialty', true),
('NIMS Hospital', 'Punjagutta, Hyderabad - 500082', '+91-40-2348-8888', 'Neurosciences', 'Government Specialty', true),
('Global Hospitals', 'Lakdi Ka Pul, Hyderabad - 500004', '+91-40-6733-7733', 'Liver Transplant, Hepatology', 'Super Specialty', true),
('Star Hospitals', 'Nanakramguda, Hyderabad - 500008', '+91-40-4477-7777', 'Gastroenterology, Pulmonology', 'Multi-Specialty', true),
('Aware Gleneagles', 'LB Nagar, Hyderabad - 500074', '+91-40-4466-6666', 'Cardiology, Orthopedics, Oncology', 'Multi-Specialty', true),
('CitiCare Cancer Hospital', 'Banjara Hills, Hyderabad - 500034', '+91-40-6677-8899', 'Oncology, Radiation Therapy', 'Cancer Specialty', true),
('Omega Hospitals', 'Banjara Hills, Hyderabad - 500034', '+91-40-3040-0000', 'Cancer Treatment, Hematology', 'Cancer Specialty', true),
('Fernandez Hospital', 'Bogulkunta, Hyderabad - 500001', '+91-40-3066-6666', 'Womens Health, Obstetrics, Neonatology', 'Womens Specialty', true),
('Lotus Hospital', 'Ameerpet, Hyderabad - 500016', '+91-40-2373-7373', 'General Medicine, Cardiology', 'General', true),
('Virinchi Hospitals', 'Road No 1, Banjara Hills, Hyderabad - 500034', '+91-40-4488-8888', 'Multi-Specialty Healthcare', 'Multi-Specialty', true),
('AIG Hospitals', 'Gachibowli, Hyderabad - 500032', '+91-40-6165-4455', 'Gastroenterology, Liver Transplant', 'Super Specialty', true),
('People Tree Hospitals', 'Yousufguda, Hyderabad - 500045', '+91-40-4488-9999', 'Orthopedics, Sports Medicine', 'Orthopedic Specialty', true),
('Medicover Hospitals', 'Madhapur, Hyderabad - 500081', '+91-40-6886-6886', 'General Medicine, Diabetology', 'Multi-Specialty', true);


-- ============================================
-- ADD DOCTORS TO HOSPITAL TIE-UPS
-- ============================================

-- Doctors for Apollo Hospitals
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(1, 'Dr. Ramesh Reddy', 'MBBS, MD, DM Cardiology', 'Cardiology', 20, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300', true, true),
(1, 'Dr. Lakshmi Prasad', 'MBBS, MD Pediatrics', 'Pediatrics', 15, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true),
(1, 'Dr. Suresh Kumar', 'MBBS, MS Neurosurgery', 'Neurosurgery', 18, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300', true, true);

-- Doctors for Yashoda Hospitals
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(2, 'Dr. Anitha Rao', 'MBBS, MD Oncology', 'Medical Oncology', 12, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300', true, true),
(2, 'Dr. Venkat Raman', 'MBBS, DM Gastroenterology', 'Gastroenterology', 16, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300', true, true);

-- Doctors for KIMS Hospitals
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(3, 'Dr. Srinivas Reddy', 'MBBS, DM Neurology', 'Neurology', 22, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300', true, true),
(3, 'Dr. Madhavi Devi', 'MBBS, MD Radiation Oncology', 'Radiation Oncology', 14, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true);

-- Doctors for Care Hospitals
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(4, 'Dr. Prakash Goud', 'MBBS, MS Orthopedics', 'Orthopedics', 19, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300', true, true),
(4, 'Dr. Swathi Reddy', 'MBBS, DM Pulmonology', 'Pulmonology', 11, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true);

-- Doctors for Rainbow Childrens Hospital
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(5, 'Dr. Divya Sharma', 'MBBS, MD Pediatrics, DCH', 'Pediatrics', 13, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true),
(5, 'Dr. Kiran Kumar', 'MBBS, DNB Neonatology', 'Neonatology', 10, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300', true, true);

-- Doctors for Continental Hospitals
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(6, 'Dr. Rajesh Goud', 'MBBS, MCh Cardiothoracic Surgery', 'Cardiothoracic Surgery', 25, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300', true, true),
(6, 'Dr. Sangeetha Reddy', 'MBBS, DM Nephrology', 'Nephrology', 17, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true);

-- Doctors for Fernandez Hospital
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(15, 'Dr. Rekha Menon', 'MBBS, MS Obstetrics & Gynecology', 'Obstetrics', 16, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true),
(15, 'Dr. Shalini Ramesh', 'MBBS, DNB Gynecology', 'Gynecology', 12, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true);

-- Doctors for AIG Hospitals
INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience, image, available, show_on_hospital_page) VALUES
(18, 'Dr. Praveen Kumar', 'MBBS, DM Gastroenterology', 'Gastroenterology', 21, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300', true, true),
(18, 'Dr. Harini Prasad', 'MBBS, DM Hepatology', 'Hepatology', 15, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300', true, true);


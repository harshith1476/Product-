-- ============================================
-- ADD 10 DOCTORS
-- ============================================

INSERT INTO doctors (name, email, password, image, speciality, degree, experience, about, fees, address_line1, address_line2, available, date) VALUES

('Dr. Priya Sharma', 'priya.sharma@medcare.com', 'doctor123', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', 'Pediatricians', 'MBBS, MD Pediatrics', '10 Years', 
 'Dr. Priya Sharma specializes in child healthcare and developmental pediatrics with a focus on preventive care.', 
 75.00, 'Apollo Clinic', 'Banjara Hills, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Rajesh Kumar', 'rajesh.kumar@wellness.com', 'doctor123', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400', 'Dermatologist', 'MBBS, MD Dermatology', '15 Years',
 'Dr. Rajesh Kumar is an expert in skin disorders, cosmetic dermatology, and laser treatments.',
 90.00, 'SkinCare Center', 'Jubilee Hills, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Anjali Reddy', 'anjali.reddy@lifecare.com', 'doctor123', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400', 'Gynecologist', 'MBBS, MS Obstetrics & Gynecology', '12 Years',
 'Dr. Anjali Reddy provides comprehensive womens health services including prenatal and postnatal care.',
 85.00, 'Rainbow Hospital', 'Somajiguda, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Vikram Singh', 'vikram.singh@neurocenter.com', 'doctor123', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400', 'Neurologist', 'MBBS, DM Neurology', '18 Years',
 'Dr. Vikram Singh specializes in neurological disorders, stroke management, and epilepsy treatment.',
 120.00, 'Neuro Specialty Center', 'Ameerpet, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Meera Patel', 'meera.patel@orthoclinic.com', 'doctor123', 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400', 'Orthopedic', 'MBBS, MS Orthopedics', '14 Years',
 'Dr. Meera Patel is an orthopedic surgeon specializing in joint replacement and sports injuries.',
 95.00, 'Bone & Joint Clinic', 'Madhapur, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Arjun Nair', 'arjun.nair@eyecare.com', 'doctor123', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400', 'Ophthalmologist', 'MBBS, MS Ophthalmology', '11 Years',
 'Dr. Arjun Nair provides advanced eye care including cataract surgery and LASIK procedures.',
 70.00, 'Vision Eye Hospital', 'Kukatpally, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Kavita Desai', 'kavita.desai@diabetescenter.com', 'doctor123', 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400', 'Endocrinologist', 'MBBS, DM Endocrinology', '13 Years',
 'Dr. Kavita Desai specializes in diabetes management, thyroid disorders, and hormonal imbalances.',
 80.00, 'Diabetes Care Center', 'Secunderabad, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Aditya Rao', 'aditya.rao@dentalcare.com', 'doctor123', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400', 'Dentist', 'BDS, MDS Prosthodontics', '9 Years',
 'Dr. Aditya Rao offers comprehensive dental care including cosmetic dentistry and implants.',
 60.00, 'SmileCare Dental Clinic', 'Gachibowli, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Sneha Iyer', 'sneha.iyer@psychiatry.com', 'doctor123', 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400', 'Psychiatrist', 'MBBS, MD Psychiatry', '16 Years',
 'Dr. Sneha Iyer provides mental health services including anxiety, depression, and stress management.',
 100.00, 'Mind Wellness Center', 'Kondapur, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Dr. Karthik Menon', 'karthik.menon@urology.com', 'doctor123', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400', 'Urologist', 'MBBS, MCh Urology', '17 Years',
 'Dr. Karthik Menon specializes in urological disorders, kidney stones, and minimally invasive surgeries.',
 110.00, 'Uro Care Clinic', 'KPHB, Hyderabad', true, EXTRACT(EPOCH FROM NOW()) * 1000);


-- ============================================
-- ADD 20 HOSPITALS
-- ============================================

INSERT INTO hospitals (name, email, password, image, address_line1, address_line2, speciality, about, available, date) VALUES

('Apollo Hospitals', 'info@apollohyd.com', 'hospital123', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400',
 'Film Nagar', 'Hyderabad - 500096', 
 ARRAY['General physician', 'Cardiologist', 'Neurologist', 'Orthopedic', 'Pediatricians'],
 'Apollo Hospitals is a leading multi-specialty hospital offering world-class healthcare services.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Yashoda Hospitals', 'contact@yashodahospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400',
 'Malakpet', 'Hyderabad - 500036',
 ARRAY['Cardiologist', 'Gastroenterologist', 'Oncologist', 'Nephrologist'],
 'Yashoda Hospitals provides comprehensive tertiary healthcare services with state-of-the-art facilities.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('KIMS Hospitals', 'info@kimshospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400',
 'Secunderabad', 'Hyderabad - 500003',
 ARRAY['Neurologist', 'Cardiologist', 'Oncologist', 'General physician'],
 'KIMS is known for excellence in neurology, cardiac care, and cancer treatment.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Care Hospitals', 'contact@carehospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=400',
 'Banjara Hills', 'Hyderabad - 500034',
 ARRAY['Orthopedic', 'Cardiologist', 'Gastroenterologist', 'Pulmonologist'],
 'Care Hospitals offers advanced medical care with a focus on patient-centric services.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Rainbow Childrens Hospital', 'info@rainbowhospitals.in', 'hospital123', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400',
 'Road No 14, Banjara Hills', 'Hyderabad - 500034',
 ARRAY['Pediatricians', 'Neonatologist', 'Pediatric Surgeon'],
 'Rainbow is Indias leading chain of multi-specialty pediatric hospitals.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Continental Hospitals', 'contact@continentalhospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400',
 'IT Park Road, Nanakramguda', 'Hyderabad - 500032',
 ARRAY['Cardiologist', 'Oncologist', 'Neurologist', 'Transplant Surgeon'],
 'Continental Hospitals is a globally benchmarked multi-organ transplant center.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Sunshine Hospitals', 'info@sunshinehospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=400',
 'Gachibowli', 'Hyderabad - 500032',
 ARRAY['General physician', 'Orthopedic', 'Gynecologist', 'ENT Specialist'],
 'Sunshine Hospitals provides quality healthcare with modern infrastructure and experienced doctors.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('MaxCure Hospitals', 'contact@maxcurehospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400',
 'Madhapur', 'Hyderabad - 500081',
 ARRAY['Cardiologist', 'Neurologist', 'Urologist', 'General physician'],
 'MaxCure is committed to delivering exceptional healthcare through innovation and compassion.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('NIMS Hospital', 'info@nims.edu.in', 'hospital123', 'https://images.unsplash.com/photo-1519494140681-8b17d830a3e9?w=400',
 'Punjagutta', 'Hyderabad - 500082',
 ARRAY['Neurologist', 'Neurosurgeon', 'General physician'],
 'Nizam Institute of Medical Sciences is a premier medical institution for neurosciences.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Global Hospitals', 'contact@globalhospitalsindia.com', 'hospital123', 'https://images.unsplash.com/photo-1613068687893-5e85b4638b56?w=400',
 'Lakdi Ka Pul', 'Hyderabad - 500004',
 ARRAY['Transplant Surgeon', 'Hepatologist', 'Cardiologist', 'Nephrologist'],
 'Global Hospitals is a leader in multi-organ transplantation and critical care.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Star Hospitals', 'info@starhospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400',
 'Nanakramguda', 'Hyderabad - 500008',
 ARRAY['Gastroenterologist', 'General physician', 'Pulmonologist'],
 'Star Hospitals specializes in gastroenterology and digestive diseases.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Aware Gleneagles', 'contact@awaregleneagles.com', 'hospital123', 'https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=400',
 'LB Nagar', 'Hyderabad - 500074',
 ARRAY['Cardiologist', 'Orthopedic', 'General physician', 'Oncologist'],
 'Aware Gleneagles Global Hospital delivers world-class healthcare with advanced technology.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('CitiCare Cancer Hospital', 'info@citicarehospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1516841273335-e39b37888115?w=400',
 'Banjara Hills', 'Hyderabad - 500034',
 ARRAY['Oncologist', 'Radiation Oncologist', 'Surgical Oncologist'],
 'CitiCare is dedicated to comprehensive cancer care and treatment.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Omega Hospitals', 'contact@omegahospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400',
 'Banjara Hills', 'Hyderabad - 500034',
 ARRAY['Oncologist', 'Hematologist', 'Surgical Oncologist'],
 'Omega Hospitals is a super specialty cancer hospital with cutting-edge treatment facilities.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Fernandez Hospital', 'info@fernandezhospital.com', 'hospital123', 'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=400',
 'Bogulkunta', 'Hyderabad - 500001',
 ARRAY['Gynecologist', 'Obstetrician', 'Neonatologist', 'Fertility Specialist'],
 'Fernandez Hospital is a premier womens and childrens healthcare facility.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Lotus Hospital', 'contact@lotushospitals.in', 'hospital123', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400',
 'Ameerpet', 'Hyderabad - 500016',
 ARRAY['General physician', 'Cardiologist', 'Orthopedic', 'Gynecologist'],
 'Lotus Hospital provides comprehensive healthcare services with personalized patient care.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Virinchi Hospitals', 'info@virinchihospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=400',
 'Road No 1, Banjara Hills', 'Hyderabad - 500034',
 ARRAY['General physician', 'Cardiologist', 'Neurologist', 'Gastroenterologist'],
 'Virinchi Hospitals combines clinical excellence with compassionate care.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('AIG Hospitals', 'contact@aighospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400',
 'Gachibowli', 'Hyderabad - 500032',
 ARRAY['Gastroenterologist', 'Hepatologist', 'Transplant Surgeon', 'General physician'],
 'AIG Hospitals is renowned for gastroenterology and liver transplantation.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('People Tree Hospitals', 'info@peopletreehospitals.com', 'hospital123', 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400',
 'Yousufguda', 'Hyderabad - 500045',
 ARRAY['Orthopedic', 'Sports Medicine', 'Physiotherapy', 'General physician'],
 'People Tree Hospitals specializes in orthopedics and sports medicine.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000),

('Medicover Hospitals', 'contact@medicoverhospitals.in', 'hospital123', 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=400',
 'Madhapur', 'Hyderabad - 500081',
 ARRAY['General physician', 'Cardiologist', 'Diabetologist', 'Pediatricians'],
 'Medicover Hospitals offers affordable quality healthcare across multiple specialties.',
 true, EXTRACT(EPOCH FROM NOW()) * 1000);


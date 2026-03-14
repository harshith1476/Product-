import google.generativeai as genai
from typing import List, Optional, Dict, Any
import json
import logging
import time
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.crud.crud_medical import medical_knowledge
from app.crud.crud_user import user as crud_user
from app.models.user import User

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Medical Keywords for intent classification
MEDICAL_KEYWORDS = [
    'fever', 'pain', 'headache', 'vomiting', 'dizziness', 'cough', 'cold', 'infection',
    'ache', 'sore', 'hurt', 'hurting', 'hurts', 'sick', 'ill', 'unwell',
    'nausea', 'diarrhea', 'constipation', 'rash', 'itchy', 'fatigue', 'tired',
    'weakness', 'dizzy', 'numbness', 'tingling', 'burning', 'stinging',
    'stomach ache', 'stomach pain', 'abdominal pain', 'back pain', 'neck pain',
    'joint pain', 'chest pain', 'throat pain', 'ear pain', 'eye pain',
    'body pain', 'body ache', 'muscle pain', 'bone pain',
    'disease', 'condition', 'disorder', 'syndrome', 'infection', 'virus', 'bacteria',
    'diabetes', 'hypertension', 'asthma', 'allergy', 'allergic', 'flu', 'influenza',
    'medicine', 'medication', 'tablet', 'pill', 'syrup', 'capsule', 'drug',
    'treatment', 'remedy', 'cure', 'therapy', 'prescription', 'heart', 'lungs', 'liver', 'kidney'
]

# Medicine Purchase Links
MEDICINE_LINKS = {
    'Paracetamol 500mg': {
        'amazon': 'https://www.amazon.in/s?k=paracetamol+500mg',
        '1mg': 'https://www.1mg.com/search/all?name=paracetamol%20500mg'
    },
    'Ibuprofen 400mg': {
        'amazon': 'https://www.amazon.in/s?k=ibuprofen+400mg',
        '1mg': 'https://www.1mg.com/search/all?name=ibuprofen%20400mg'
    },
    'Crocin': {
        'amazon': 'https://www.amazon.in/s?k=crocin',
        '1mg': 'https://www.1mg.com/search/all?name=crocin'
    }
    # ... can add more as needed
}

class AIService:
    def classify_intent(self, message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        lower_msg = message.lower()
        full_context = lower_msg
        if history:
            recent = " ".join([m.get("content", "").lower() for m in history[-3:]])
            full_context = f"{recent} {lower_msg}"

        detected = [k for k in MEDICAL_KEYWORDS if k in full_context]
        
        # Simple pattern checks
        patterns = ["what medicine", "can i take", "how to treat", "how to cure"]
        has_pattern = any(p in lower_msg for p in patterns)

        if detected or has_pattern:
            return {
                "intent": "MEDICAL_MODE",
                "confidence": "high" if (detected and has_pattern) else "medium",
                "detectedKeywords": detected
            }
        return {"intent": "NORMAL_MODE", "confidence": "high", "detectedKeywords": []}

    async def get_gemini_response(self, prompt: str, history: List[Dict[str, str]] = None, system_prompt: str = "") -> str:
        if not settings.GEMINI_API_KEY:
            return "Gemini API key not configured."
            
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            # Gemini doesn't use 'system' role the same way in all SDK versions, 
            # we'll prepend to the prompt for safety
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Simple chat logic
            chat = model.start_chat(history=[]) # Could convert history but for now keep it simple
            response = chat.send_message(full_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            return f"I'm sorry, I'm having trouble connecting to my brain right now."

    def get_medicine_links(self, med_name: str) -> Dict[str, str]:
        # Generic fallback
        encoded = med_name.replace(" ", "+")
        links = {
            "amazon": f"https://www.amazon.in/s?k={encoded}",
            "1mg": f"https://www.1mg.com/search/all?name={encoded}",
            "netmeds": f"https://www.netmeds.com/catalogsearch/result?q={encoded}",
            "pharmeasy": f"https://pharmeasy.in/search/all?name={encoded}"
        }
        # Check if we have specific links
        for key, specific in MEDICINE_LINKS.items():
            if key.lower() in med_name.lower() or med_name.lower() in key.lower():
                links.update(specific)
                break
        return links

    async def get_doctors_context(self, db: AsyncSession) -> Dict[str, Any]:
        from app.crud.crud_user import user as crud_user # Avoid circular import
        from app.models.hospital import HospitalTieUpDoctor
        
        # Get all doctors with availability
        query = select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.available == True)
        result = await db.execute(query)
        doctors = result.scalars().all()
        
        specialties = list(set([doc.speciality for doc in doctors if doc.speciality]))
        
        return {
            "doctors": [
                {
                    "id": d.id,
                    "name": d.name,
                    "speciality": d.speciality,
                    "degree": d.degree,
                    "experience": d.experience,
                    "fees": d.fees
                } for d in doctors
            ],
            "specialties": specialties
        }

    async def get_available_slots(self, db: AsyncSession, doc_id: int) -> List[Dict[str, Any]]:
        from app.models.hospital import HospitalTieUpDoctor
        result = await db.execute(select(HospitalTieUpDoctor).where(HospitalTieUpDoctor.id == doc_id))
        doctor = result.scalar_one_or_none()
        if not doctor:
            return []
            
        # Implementation of slot logic from Node
        # We can simplify for now or port the exact 7-day logic
        # For parity, let's use a simpler version
        slots_booked = doctor.slots_booked or {}
        if isinstance(slots_booked, str):
            try: slots_booked = json.loads(slots_booked)
            except: slots_booked = {}
            
        available_slots = []
        # Mocking 3 days of slots for now (real logic would involve complex date math)
        for i in range(3):
            date_str = f"day_{i}" # Simplified
            available_slots.append({
                "date": date_str,
                "displayDate": f"Day {i+1}",
                "slots": [{"time": "10:00 AM", "displayTime": "10:00 AM"}]
            })
        return available_slots

    def extract_booking_intent(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        lower_msg = message.lower()
        intent = {
            "specialty": None,
            "doctorName": None,
            "doctorId": None
        }
        
        for doc in context["doctors"]:
            if doc["name"].lower() in lower_msg:
                intent["doctorName"] = doc["name"]
                intent["doctorId"] = doc["id"]
                break
                
        if not intent["doctorId"]:
            for spec in context["specialties"]:
                if spec.lower() in lower_msg:
                    intent["specialty"] = spec
                    break
        return intent

    async def ai_chat(self, message: str, history: List[Dict[str, Any]], db: AsyncSession, user_id: Optional[int] = None) -> Dict[str, Any]:
        intent_class = self.classify_intent(message, history)
        
        # Mode 1: Medical Mode
        if intent_class["intent"] == "MEDICAL_MODE":
            return await self.handle_medical_mode(message, intent_class, db)
            
        # Mode 2: Normal Mode / Booking
        context = await self.get_doctors_context(db)
        booking_intent = self.extract_booking_intent(message, context)
        
        selected_doc = None
        available_slots = None
        
        if booking_intent["doctorId"]:
            selected_doc = next((d for d in context["doctors"] if d["id"] == booking_intent["doctorId"]), None)
            if selected_doc:
                available_slots = await self.get_available_slots(db, selected_doc["id"])
        elif booking_intent["specialty"]:
            # Find first doctor in specialty
            selected_doc = next((d for d in context["doctors"] if d["speciality"] == booking_intent["specialty"]), None)
            if selected_doc:
                available_slots = await self.get_available_slots(db, selected_doc["id"])

        system_prompt = f"""You are MediChain AI. Respond in 1-2 SHORT sentences. Friendly, clear.
AVAILABLE DOCTORS: {', '.join([d['name'] for d in context['doctors']])}
"""
        if selected_doc and available_slots:
            system_prompt += f"\nFound Dr. {selected_doc['name']}. Slots: {available_slots[0]['slots'][0]['time']}."
            
        ai_response = await self.get_gemini_response(message, history, system_prompt)
        
        response_data = {
            "success": True,
            "response": ai_response,
            "suggestedActions": [],
            "timestamp": datetime.now().isoformat(),
            "provider": "Google Gemini (FREE)"
        }
        
        if selected_doc and available_slots:
            response_data["bookingData"] = {
                "doctorId": selected_doc["id"],
                "doctorName": selected_doc["name"],
                "specialty": selected_doc["speciality"],
                "fees": selected_doc["fees"],
                "availableSlots": available_slots
            }
            response_data["suggestedActions"].append({
                "type": "book_appointment",
                "label": f"Book with {selected_doc['name']}",
                "action": f"navigate_to_doctor/{selected_doc['id']}"
            })
            
        return response_data

    async def handle_medical_mode(self, message: str, intent: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        keywords = intent.get("detectedKeywords", [])
        kb_results = []
        for kw in keywords[:2]: # Search first 2 keywords
            results = await medical_knowledge.search_medical_knowledge(db, kw)
            kb_results.extend(results)
        
        # Extract data from KB
        conditions = [r.keyword for r in kb_results]
        medicines = []
        for r in kb_results:
            if r.otc_medicines:
                medicines.extend(r.otc_medicines)
        
        # Formatting system prompt like Node handler
        system_prompt = """You are MediChain AI. Give SIMPLE, SHORT answers (8th-class level).
STRICT FORMAT:
**Simple Explanation**
[1 short sentence]
**Possible Causes**
• [Cause 1]
**Safe Over-the-Counter Medicines**
• [Med name] - [purpose]
**Home Remedies**
• [Remedy 1]
**When to See a Doctor**
• [Condition]
**Disclaimer**
"This is general information, not a medical diagnosis. Consult a certified doctor for proper care."
"""
        user_prompt = f"""Question: {message}
Knowledge base info: {', '.join(conditions[:3])}
Meds: {', '.join(medicines[:2])}
"""
        response_text = await self.get_gemini_response(user_prompt, system_prompt=system_prompt)
        
        # Prepare structured response for frontend
        meds_with_links = []
        for m in medicines[:2]:
            meds_with_links.append({"name": m, "links": self.get_medicine_links(m)})

        return {
            "success": True,
            "response": response_text,
            "mode": "MEDICAL_MODE",
            "medicalData": {
                "detectedKeywords": keywords,
                "source": "Medical Knowledge Base",
                "medicines": meds_with_links
            }
        }

ai_service = AIService()

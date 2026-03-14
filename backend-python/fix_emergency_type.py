import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def fix_enum():
    engine = create_async_engine('postgresql+asyncpg://postgres:Javali786@localhost/healthsystem_pg')
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE emergency_contacts DROP CONSTRAINT emergency_contacts_contact_type_check;'))
            print('Dropped constraint.')
        except Exception as e:
            print('Error dropping constraint:', e)
            
        try:
            # Re-add constraint with Primary and Secondary included, or just remove it.
            await conn.execute(text("ALTER TABLE emergency_contacts ADD CONSTRAINT emergency_contacts_contact_type_check CHECK (contact_type IN ('friend', 'family', 'Primary', 'Secondary'));"))
            print('Added updated constraint.')
        except Exception as e:
            print('Error adding constraint:', e)

if __name__ == "__main__":
    asyncio.run(fix_enum())

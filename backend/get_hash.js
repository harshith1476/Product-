import bcrypt from 'bcryptjs';

async function getHash() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);
    console.log(hashedPassword);
}

getHash().catch(console.error);

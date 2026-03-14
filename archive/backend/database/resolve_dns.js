
import axios from 'axios';

async function resolve() {
    const host = 'aws-0-ap-south-1.pooler.supabase.com';
    try {
        console.log(`Resolving ${host} via Google DNS API...`);
        const resp = await axios.get(`https://dns.google/resolve?name=${host}&type=A`);
        if (resp.data.Answer) {
            console.log('Found IPs:');
            resp.data.Answer.forEach(ans => console.log(ans.data));
        } else {
            console.log('No Answer found.');
            console.log(JSON.stringify(resp.data, null, 2));
        }
    } catch (err) {
        console.error('Error resolving:', err.message);
    }
}

resolve();


import axios from 'axios';

async function resolveAAAA() {
    const host = 'db.hrtayvqddtpetpbskycl.supabase.co';
    try {
        console.log(`Resolving AAAA (IPv6) for ${host} via Google DNS API...`);
        const resp = await axios.get(`https://dns.google/resolve?name=${host}&type=AAAA`);
        if (resp.data.Answer) {
            console.log('Found IPv6s:');
            resp.data.Answer.forEach(ans => console.log(ans.data));
        } else {
            console.log('No IPv6 Answer found.');
            // console.log(JSON.stringify(resp.data, null, 2));
        }
    } catch (err) {
        console.error('Error resolving:', err.message);
    }
}

resolveAAAA();

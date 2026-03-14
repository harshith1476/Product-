import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Home, ShieldCheck, Printer, Share2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'react-qr-code';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-toastify';

const AppointmentConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const cardRef = useRef(null);
    const { appointmentData } = location.state || {};

    // Helper to format values safely
    const formatValue = (val) => {
        if (!val) return 'N/A';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            if (val.line1) return `${val.line1}${val.line2 ? `, ${val.line2}` : ''}`;
            if (val.city) return `${val.line1 || ''} ${val.city}`;
            return JSON.stringify(val);
        }
        return String(val);
    };

    // Fallback data
    const data = appointmentData || {
        patientName: "Rahul Kumar",
        providerName: "Dr. Sharma",
        providerType: "doctor",
        service: "General Checkup",
        date: "12 March 2026",
        time: "10:30 AM",
        location: "MediChain Clinic, Road No. 12, Banjara Hills",
        id: "MCN-483920"
    };

    // ACTION: Download as PDF
    const handleDownload = () => {
        const element = cardRef.current;
        const opt = {
            margin: 0.2,
            filename: `MediChain_AdmitCard_${data.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        toast.info("Generating your admit card PDF...");
        html2pdf().from(element).set(opt).save().then(() => {
            toast.success("Download complete!");
        }).catch(err => {
            console.error("PDF Error:", err);
            toast.error("Failed to generate PDF");
        });
    };

    // ACTION: Print
    const handlePrint = () => {
        window.print();
    };

    // ACTION: Share
    const handleShare = async () => {
        const shareData = {
            title: 'MediChain+ Appointment Pass',
            text: `My appointment with ${data.providerName} is confirmed for ${data.date} at ${data.time}. ID: ${data.id}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                toast.success("Details copied to clipboard!");
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden py-12 px-6">
            {/* Print-only CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .print-container { 
                        display: flex !important; 
                        justify-content: center !important; 
                        align-items: flex-start !important;
                        padding-top: 20px !important;
                    }
                    #admit-card-to-print {
                        box-shadow: none !important;
                        border: 1px solid #eee !important;
                        width: 360px !important;
                        margin: 0 auto !important;
                    }
                }
            ` }} />

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-20 pointer-events-none no-print">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-400 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-[360px] w-full z-10 print-container">
                {/* Vertical Admit Card */}
                <motion.div 
                    ref={cardRef}
                    id="admit-card-to-print"
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col relative"
                >
                    {/* Official Medical Header */}
                    <div className="bg-[#0f172a] text-white p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500/10 rounded-full -ml-8 -mb-8 blur-lg"></div>
                        
                        <div className="relative flex flex-col items-center">
                            <span className="text-[10px] font-black tracking-[0.4em] text-blue-300 mb-1">OFFICIAL PASS</span>
                            <h1 className="text-xl font-bold tracking-tight text-white">MEDICHAIN+</h1>
                            <p className="text-[10px] font-medium text-white/80 mt-1 uppercase tracking-widest leading-none">Admission & Appointment Slip</p>
                        </div>
                    </div>

                    {/* Confirmed Ribbon */}
                    <div className="bg-emerald-500 text-white text-[10px] font-black py-1.5 text-center uppercase tracking-[0.2em] shadow-sm">
                        Appointment Confirmed ✓
                    </div>

                    {/* Card Body with Watermark */}
                    <div className="p-6 relative">
                        {/* Subtle Logo Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
                            <h2 className="text-8xl font-black">MC+</h2>
                        </div>

                        {/* Patient Information Grid */}
                        <div className="space-y-4 relative z-10">
                            {[
                                { label: 'Patient Name', value: data.patientName, bold: true },
                                { label: data.providerType === 'lab' ? 'Diagnostic Center' : 'Attending Doctor', value: data.providerName, bold: true },
                                { label: 'Service Category', value: data.service },
                                { label: 'Schedule Date', value: data.date },
                                { label: 'Arrival Time', value: data.time },
                                { label: 'Gate / Location', value: data.location, compact: true },
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</span>
                                    <span className={`text-sm ${item.bold ? 'font-bold text-gray-900 uppercase' : 'font-semibold text-gray-700'} ${item.compact ? 'leading-snug' : ''}`}>
                                        {formatValue(item.value)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Registration ID</span>
                                <span className="text-xs font-mono font-bold text-slate-700">{data.id}</span>
                            </div>
                            <ShieldCheck className="text-blue-600 opacity-20" size={20} />
                        </div>
                    </div>

                    {/* Technical Section (QR & Security) */}
                    <div className="px-6 pb-8 flex flex-col items-center">
                        <div className="relative py-4 w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-dashed border-gray-200"></span>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center">Security Check-in</span>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-gray-100 mb-4 transform hover:scale-105 transition-transform duration-500">
                            <QRCode 
                                value={data.qrData || `https://medichain.plus/verify/${data.id}`} 
                                size={110} 
                                level="H"
                                fgColor="#0f172a"
                            />
                        </div>
                        
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-900 uppercase tracking-[0.2em] mb-1">Digital Admission Link</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed max-w-[150px]">
                                Present this digital pass at the reception counter for seamless check-in.
                            </p>
                        </div>
                    </div>

                    {/* Edge Cutouts */}
                    <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border border-gray-100 shadow-inner no-print"></div>
                    <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border border-gray-100 shadow-inner no-print"></div>
                </motion.div>

                {/* Primary Actions */}
                <div className="mt-8 flex flex-col gap-3 no-print">
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: '#1d4ed8' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-[0_20px_40px_-15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 transition-all"
                    >
                        <Download size={20} className="animate-bounce" />
                        DOWNLOAD ADMIT CARD
                    </motion.button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handlePrint}
                            className="h-12 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                        >
                            <Printer size={16} /> Print
                        </button>
                        <button 
                            onClick={handleShare}
                            className="h-12 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                        >
                            <Share2 size={16} /> Share
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full h-12 mt-2 rounded-xl text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
                    >
                        Return to Main Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentConfirmation;

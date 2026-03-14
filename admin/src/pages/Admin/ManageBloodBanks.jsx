import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import GlassCard from '../../components/ui/GlassCard'

const ManageBloodBanks = () => {
    const { bloodBanks, getAllBloodBanks, addBloodBank, updateBloodBank, deleteBloodBank } = useContext(AdminContext)

    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBB, setEditingBB] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        city: '',
        latitude: '',
        longitude: '',
        partnerType: 'normal',
        availableBlood: {
            "A+": "Available",
            "A-": "Limited",
            "B+": "Available",
            "B-": "Unavailable",
            "AB+": "Available",
            "AB-": "Limited",
            "O+": "Available",
            "O-": "Urgent"
        }
    })

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    const statusOptions = ["Available", "Limited", "Unavailable", "Urgent"]

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        await getAllBloodBanks()
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const bbData = {
            ...formData,
            latitude: 0,
            longitude: 0
        }

        let success
        if (editingBB) {
            success = await updateBloodBank(editingBB.id, bbData)
        } else {
            success = await addBloodBank(bbData)
        }

        if (success) {
            setShowModal(false)
            resetForm()
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            city: '',
            latitude: '',
            longitude: '',
            partnerType: 'normal',
            availableBlood: {
                "A+": "Available",
                "A-": "Available",
                "B+": "Available",
                "B-": "Available",
                "AB+": "Available",
                "AB-": "Available",
                "O+": "Available",
                "O-": "Available"
            }
        })
        setEditingBB(null)
    }

    const handleEdit = (bb) => {
        setEditingBB(bb)
        setFormData({
            name: bb.name,
            location: bb.location,
            city: bb.city,
            latitude: bb.latitude,
            longitude: bb.longitude,
            partnerType: bb.partner_type,
            availableBlood: bb.available_blood
        })
        setShowModal(true)
    }

    const handleBloodStatusChange = (group, status) => {
        setFormData(prev => ({
            ...prev,
            availableBlood: {
                ...prev.availableBlood,
                [group]: status
            }
        }))
    }

    return (
        <div className='w-full p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50'>
            <div className='max-w-6xl mx-auto'>
                <div className='flex justify-between items-center mb-6'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-900'>Manage Collaborated Blood Banks</h1>
                        <p className='text-gray-500'>Control blood availability and partner status in real-time.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true) }}
                        className='px-6 py-2.5 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all font-semibold flex items-center gap-2'
                    >
                        <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Blood Bank
                    </button>
                </div>

                {loading ? (
                    <div className='text-center py-20 font-medium text-gray-500'>Loading blood banks...</div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {bloodBanks.map(bb => (
                            <GlassCard key={bb.id} className='bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all'>
                                <div className='flex justify-between items-start mb-4'>
                                    <div>
                                        <h3 className='text-xl font-bold text-gray-900'>{bb.name}</h3>
                                        <p className='text-sm text-gray-500'>{bb.location}, {bb.city}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bb.partner_type === 'partner' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {bb.partner_type}
                                    </span>
                                </div>

                                <div className='grid grid-cols-4 gap-2 mb-6'>
                                    {Object.entries(bb.available_blood).map(([group, status]) => (
                                        <div key={group} className='flex flex-col items-center p-2 rounded-lg bg-gray-50 border border-gray-100'>
                                            <span className='text-xs font-bold text-red-600'>{group}</span>
                                            <span className={`text-[9px] font-medium leading-none mt-1 ${status === 'Available' ? 'text-green-600' :
                                                    status === 'Urgent' ? 'text-red-600 animate-pulse' :
                                                        status === 'Limited' ? 'text-amber-600' : 'text-gray-400'
                                                }`}>{status}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className='flex items-center gap-2 pt-4 border-t border-gray-100'>
                                    <button onClick={() => handleEdit(bb)} className='flex-1 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors'>Update Inventory</button>
                                    <button onClick={() => deleteBloodBank(bb.id)} className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'>
                                        <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}

                {/* Blood Bank Modal */}
                {showModal && (
                    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto'>
                        <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto'>
                            <div className='bg-red-600 px-6 py-4 flex items-center justify-between'>
                                <h2 className='text-xl font-bold text-white'>{editingBB ? 'Update Blood Bank' : 'Add Blood Bank'}</h2>
                                <button onClick={() => setShowModal(false)} className='text-white/80 hover:text-white'>
                                    <svg className='w-6 h-6' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className='p-6 space-y-6'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className='col-span-2'>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Bank Name</label>
                                        <input type='text' required className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none' value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Location</label>
                                        <input type='text' required className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none' value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>City</label>
                                        <input type='text' required className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none' value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Partner Type</label>
                                        <select className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none' value={formData.partnerType} onChange={e => setFormData({ ...formData, partnerType: e.target.value })}>
                                            <option value="normal">Normal</option>
                                            <option value="partner">Partner</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <h3 className='text-sm font-bold text-gray-800 mb-3 border-b pb-2'>Blood Inventory Status</h3>
                                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                                        {bloodGroups.map(group => (
                                            <div key={group} className='space-y-1'>
                                                <label className='block text-[10px] font-bold text-red-600 uppercase'>{group}</label>
                                                <select
                                                    className='w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-red-500 outline-none'
                                                    value={formData.availableBlood[group]}
                                                    onChange={(e) => handleBloodStatusChange(group, e.target.value)}
                                                >
                                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className='flex gap-3 pt-4'>
                                    <button type='button' onClick={() => setShowModal(false)} className='flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all'>Cancel</button>
                                    <button type='submit' className='flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all'>
                                        {editingBB ? 'Update Bank' : 'Create Bank'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ManageBloodBanks

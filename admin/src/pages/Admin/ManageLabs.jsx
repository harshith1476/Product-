import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import GlassCard from '../../components/ui/GlassCard'

const ManageLabs = () => {
    const { labs, getAllLabs, addLab, updateLab, deleteLab } = useContext(AdminContext)

    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingLab, setEditingLab] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        city: '',
        latitude: '',
        longitude: '',
        rating: 4.5,
        verified: true,
        services: '',
        openNow: true,
        partnerType: 'normal'
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        await getAllLabs()
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const labData = {
            ...formData,
            latitude: 0,
            longitude: 0,
            services: formData.services.split(',').map(s => s.trim()).filter(s => s !== '')
        }

        let success
        if (editingLab) {
            success = await updateLab(editingLab.id, labData)
        } else {
            success = await addLab(labData)
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
            rating: 4.5,
            verified: true,
            services: '',
            openNow: true,
            partnerType: 'normal'
        })
        setEditingLab(null)
    }

    const handleEdit = (lab) => {
        setEditingLab(lab)
        setFormData({
            name: lab.name,
            location: lab.location,
            city: lab.city,
            latitude: lab.latitude,
            longitude: lab.longitude,
            rating: lab.rating,
            verified: lab.verified,
            services: lab.services.join(', '),
            openNow: lab.open_now,
            partnerType: lab.partner_type
        })
        setShowModal(true)
    }

    return (
        <div className='w-full p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50'>
            <div className='max-w-6xl mx-auto'>
                <div className='flex justify-between items-center mb-6'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-900'>Manage Collaborated Labs</h1>
                        <p className='text-gray-500'>Add, update and verify diagnostic labs across the platform.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true) }}
                        className='px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-semibold flex items-center gap-2'
                    >
                        <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add New Lab
                    </button>
                </div>

                {loading ? (
                    <div className='text-center py-20 font-medium text-gray-500'>Loading labs...</div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {labs.map(lab => (
                            <GlassCard key={lab.id} className='bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all'>
                                <div className='flex justify-between items-start mb-4'>
                                    <div>
                                        <h3 className='text-lg font-bold text-gray-900'>{lab.name}</h3>
                                        <p className='text-sm text-gray-500'>{lab.location}, {lab.city}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${lab.partner_type === 'partner' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {lab.partner_type}
                                    </span>
                                </div>

                                <div className='space-y-3 mb-5'>
                                    <div className='flex items-center gap-2 text-sm'>
                                        <span className={`w-2 h-2 rounded-full ${lab.verified ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className={lab.verified ? 'text-green-600 font-medium' : 'text-gray-400'}>{lab.verified ? 'Verified' : 'Unverified'}</span>
                                    </div>
                                    <div className='flex flex-wrap gap-1'>
                                        {lab.services.slice(0, 3).map(service => (
                                            <span key={service} className='text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded'>{service}</span>
                                        ))}
                                        {lab.services.length > 3 && <span className='text-[10px] text-gray-400'>+{lab.services.length - 3} more</span>}
                                    </div>
                                </div>

                                <div className='flex items-center gap-2 pt-4 border-t border-gray-100'>
                                    <button onClick={() => handleEdit(lab)} className='flex-1 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors'>Edit</button>
                                    <button onClick={() => deleteLab(lab.id)} className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'>
                                        <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}

                {/* Lab Modal */}
                {showModal && (
                    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto'>
                        <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto'>
                            <div className='bg-indigo-600 px-6 py-4 flex items-center justify-between'>
                                <h2 className='text-xl font-bold text-white'>{editingLab ? 'Edit Lab' : 'Add New Lab'}</h2>
                                <button onClick={() => setShowModal(false)} className='text-white/80 hover:text-white'>
                                    <svg className='w-6 h-6' fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div className='col-span-1 sm:col-span-2'>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Lab Name</label>
                                        <input type='text' required className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none' value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Location</label>
                                        <input type='text' required className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none' value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>City</label>
                                        <input type='text' required className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none' value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </div>

                                    <div className='col-span-1 sm:col-span-2'>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Services (comma separated)</label>
                                        <input type='text' placeholder='Blood Test, MRI, CT Scan' className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none' value={formData.services} onChange={e => setFormData({ ...formData, services: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Partner Type</label>
                                        <select className='w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none' value={formData.partnerType} onChange={e => setFormData({ ...formData, partnerType: e.target.value })}>
                                            <option value="normal">Normal</option>
                                            <option value="partner">Partner</option>
                                        </select>
                                    </div>
                                    <div className='flex items-center gap-4 pt-4'>
                                        <div className='flex items-center gap-2'>
                                            <input type='checkbox' id='verified' checked={formData.verified} onChange={e => setFormData({ ...formData, verified: e.target.checked })} />
                                            <label htmlFor='verified' className='text-xs font-bold text-gray-700'>Verified</label>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <input type='checkbox' id='openNow' checked={formData.openNow} onChange={e => setFormData({ ...formData, openNow: e.target.checked })} />
                                            <label htmlFor='openNow' className='text-xs font-bold text-gray-700'>Open Now</label>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex gap-3 mt-6'>
                                    <button type='button' onClick={() => setShowModal(false)} className='flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all'>Cancel</button>
                                    <button type='submit' className='flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all'>
                                        {editingLab ? 'Update Lab' : 'Create Lab'}
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

export default ManageLabs

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Droplets, Search } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import LabCard from '../components/LabCard';
import LabFilters from '../components/LabFilters';
import BookTestModal from '../components/BookTestModal';
import BloodBankCard from '../components/BloodBankCard';
import { AppContext } from '../context/AppContext';
import BackButton from '../components/BackButton';
import BackArrow from '../components/BackArrow';
import { getUserLocation, formatDistance } from '../utils/locationUtils';
import axios from 'axios';
import { toast } from 'react-toastify';

const BloodDropLoader = () => (
  <div className="flex justify-center items-center py-20 gap-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: i * 0.2,
        }}
        className="w-4 h-6 bg-[#dc2626] rounded-t-full rounded-b-[50%] shadow-lg shadow-red-500/20"
      />
    ))}
  </div>
);

const Labs = () => {
  const { backendUrl } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('labs');
  const [search, setSearch] = useState('');
  const [testType, setTestType] = useState('All Tests');
  const [rating, setRating] = useState('All Ratings');
  const [isOpenOnly, setIsOpenOnly] = useState(false);
  const [isLabsLoading, setIsLabsLoading] = useState(true);
  const [isBloodLoading, setIsBloodLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [labs, setLabs] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'nearby'
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Fetch Labs
  const fetchLabs = async () => {
    setIsLabsLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/lab/list`);
      if (data.success) {
        setLabs(data.labs);
      }
    } catch (error) {
      console.error("Error fetching labs:", error);
    } finally {
      setIsLabsLoading(false);
    }
  };

  // Fetch Blood Banks
  const fetchBloodBanks = async () => {
    setIsBloodLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/blood-bank/list`);
      if (data.success) {
        setBloodBanks(data.bloodBanks);
      }
    } catch (error) {
      console.error("Error fetching blood banks:", error);
    } finally {
      setIsBloodLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    fetchBloodBanks();
  }, [backendUrl]);

  // Handle nearby view mode
  useEffect(() => {
    if (viewMode === 'nearby') {
      handleFindNearby();
    }
  }, [viewMode]);

  const handleFindNearby = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      
      // Fetch nearby labs from API
      const labsRes = await axios.get(`${backendUrl}/api/lab/nearby`, {
        params: { lat: location.lat, lng: location.lon }
      });
      if (labsRes.data.success) {
        setLabs(labsRes.data.labs);
      }

      // Fetch nearby blood banks from API
      const bloodRes = await axios.get(`${backendUrl}/api/blood-bank/nearby`, {
        params: { lat: location.lat, lng: location.lon }
      });
      if (bloodRes.data.success) {
        setBloodBanks(bloodRes.data.bloodBanks);
      }
      
      toast.success("Found nearest centers for you!");
    } catch (error) {
      console.error("Error finding nearby:", error);
      toast.error("Could not get your location. Showing all results.");
      setViewMode('all');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Calculate distances and sort
  const labsToDisplay = useMemo(() => {
    return labs.map(lab => ({
      ...lab,
      tests: lab.services || [],
      status: lab.openNow ? "Open Now" : "Closed",
      distance: lab.distance // distance comes from API now
    }));
  }, [labs]);

  // Filtering logic
  const filteredLabs = useMemo(() => {
    return labsToDisplay.filter(lab => {
      const matchesSearch = lab.name.toLowerCase().includes(search.toLowerCase()) ||
        lab.tests.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesTest = testType === 'All Tests' || lab.tests.includes(testType);
      const matchesRating = rating === 'All Ratings' || lab.rating >= parseInt(rating);
      const matchesOpen = !isOpenOnly || lab.status === 'Open Now';

      return matchesSearch && matchesTest && matchesRating && matchesOpen;
    });
  }, [labsToDisplay, search, testType, rating, isOpenOnly]);

  const handleBook = (lab) => {
    setSelectedLab(lab);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white pb-20 pt-24 sm:pt-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Breadcrumb Navigation */}
        <div className='mb-6 flex items-center gap-4'>
          <BackArrow />
          <BackButton to="/" label="Back to Home" />
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2"
          >
            All <span className="text-cyan-500">Labs & Blood Banks</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto font-medium"
          >
            Browse our network of trusted, collaborated labs and blood centers near you.
          </motion.p>

          <div className="flex bg-white/20 backdrop-blur-md p-1 rounded-full w-fit mx-auto shadow-sm mt-6 mb-8 border border-white/40">
            <button
              onClick={() => setActiveTab('labs')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activeTab === 'labs'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:bg-white/30'
                }`}
            >
              <Beaker size={14} />
              Collaborated Labs
            </button>
            <button
              onClick={() => setActiveTab('blood')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activeTab === 'blood'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-200/50'
                }`}
            >
              <Droplets size={14} />
              Collaborated Blood Banks
            </button>
          </div>
        </div>

        {/* Filters and List */}
        <AnimatePresence mode="wait">
          {activeTab === 'labs' ? (
            <motion.div
              key="labs-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <LabFilters
                search={search}
                setSearch={setSearch}
                testType={testType}
                setTestType={setTestType}
                rating={rating}
                setRating={setRating}
                isOpenOnly={isOpenOnly}
                setIsOpenOnly={setIsOpenOnly}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isLoadingLocation={isLoadingLocation}
              />

              <div className="mt-8">
                {isLabsLoading ? (
                   <div className="flex justify-center items-center py-20">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                   </div>
                ) : filteredLabs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredLabs.map((lab) => (
                      <LabCard key={lab.id} lab={lab} onBook={handleBook} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white/30 backdrop-blur-md rounded-2xl border border-dashed border-gray-200">
                    <Search className="text-gray-400 mx-auto mb-3" size={40} />
                    <h3 className="text-lg font-bold text-gray-700">No matching labs found</h3>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Try adjusting your filters or search terms</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="blood-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              {isBloodLoading ? (
                <BloodDropLoader />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                  {bloodBanks.map((bank) => (
                    <BloodBankCard key={bank.id} bank={{
                      ...bank,
                      partner: bank.partner_type === 'partner',
                      availability: bank.available_blood
                    }} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BookTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lab={selectedLab}
      />
    </div>
  );
};

export default Labs;

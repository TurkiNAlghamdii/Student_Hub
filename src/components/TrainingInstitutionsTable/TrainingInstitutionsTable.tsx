import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { BuildingOfficeIcon, MapPinIcon, LinkIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import AddInstitutionForm from './AddInstitutionForm';

interface TrainingInstitution {
  id: number;
  name: string;
  category: string;
  city: string;
  application_link: string;
  notes: string;
  twitter: string;
}

const TrainingInstitutionsTable: React.FC = () => {
  const [institutions, setInstitutions] = useState<TrainingInstitution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<TrainingInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('training_institutions')
        .select('*')
        .order('name');

      if (error) throw error;
      setInstitutions(data || []);
      setFilteredInstitutions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching institutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    const filtered = institutions.filter(institution => {
      const searchLower = searchQuery.toLowerCase();
      return (
        institution.name.toLowerCase().includes(searchLower) ||
        institution.category.toLowerCase().includes(searchLower) ||
        institution.city.toLowerCase().includes(searchLower)
      );
    });
    setFilteredInstitutions(filtered);
  }, [searchQuery, institutions]);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchInstitutions();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark:text-red-400 text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-gray-800 mb-2">Training Institutions</h2>
          <p className="dark:text-gray-400 text-gray-600">Find and apply to approved training institutions for your summer training program</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Institution
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 dark:text-gray-400 text-gray-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, category, or city..."
          className="block w-full pl-10 pr-3 py-2 dark:border-gray-700 border-gray-300 rounded-md leading-5 dark:bg-gray-800 bg-white dark:text-white text-gray-800 dark:placeholder-gray-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <AddInstitutionForm 
            onSuccess={handleAddSuccess} 
            onCancel={() => setShowAddForm(false)} 
          />
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y dark:divide-gray-700/50 divide-gray-200/50">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Institution
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Links
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700/50 divide-gray-200/50">
            {filteredInstitutions.map((institution) => (
              <motion.tr
                key={institution.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="dark:hover:bg-gray-800/50 hover:bg-gray-100/70 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-2">
                        <BuildingOfficeIcon className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium dark:text-white text-gray-800">{institution.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-emerald-400 mr-2" />
                    <span className="text-sm dark:text-gray-300 text-gray-600">{institution.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-emerald-400 mr-2" />
                    <span className="text-sm dark:text-gray-300 text-gray-600">{institution.city}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    {institution.application_link && (
                      <a
                        href={institution.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                      >
                        <LinkIcon className="h-5 w-5" />
                      </a>
                    )}
                    {institution.twitter && (
                      <a
                        href={`https://twitter.com/${institution.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm dark:text-gray-400 text-gray-600">{institution.notes || 'No additional notes'}</p>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainingInstitutionsTable; 
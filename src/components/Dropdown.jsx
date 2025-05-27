import React, { useState, useEffect  } from 'react';
import { toast } from 'react-toastify';
import { useStateContext } from '../context';




const Dropdown = ({ selected_status ,onSelect }) => { 
    const [status, setStatus] = useState('Active');
    const [disaster, setDisaster] = useState('');
    const [disasterOptions, setDisasterOptions] = useState([]);  

    // API
    const { address, getDisaster } = useStateContext();

    const isLoggedIn = !!address;
    
    useEffect(() => {
      const fetchDisasters = async () => {
        if (status) {
          const disasters = await getDisaster(status);
          setDisasterOptions(disasters);
        } else {
          setDisasterOptions([]);
        }
      };

      fetchDisasters();
    }, [status]);

    useEffect(() => {
      if (disasterOptions.length > 0) {
        const firstId = disasterOptions[0].id;
        setDisaster(firstId);

        if (onSelect) {
          onSelect({ disasterId: firstId, status });
        }
      }
    }, [disasterOptions]);


    const handleChange = (e) => {
      const value = e.target.value;
      setStatus(value);
      setDisaster('');
    };

    
    const handleDisasterChange = (e) => {
        const id = e.target.value;
        setDisaster(id);

        // ✅ 主動通知父層
        if (onSelect) {
            onSelect({ status, disasterId: id });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            

            <div className="flex gap-8 items-end">
                {/* 狀態下拉選單 */}
                <div className="flex flex-col gap-1" style={{ textAlignLast: 'center' }}>
                    <label className="text-sm text-gray-300">Status</label>
                    <select
                        value={status}
                        onChange={handleChange}
                        className="bg-[#2c2f32] text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">-- Select Status --</option>
                        <option value="Active">Active</option>
                        {isLoggedIn && <option value="Votable">Votable</option>}
                        <option value="Expired">Expired</option>
                        
                    </select>
                </div>

                {/* 災害下拉選單 */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-sm text-gray-300" style={{ textAlignLast: 'center' }}>Disaster Category</label>
                    <select
                        key={status}
                        value={disaster}
                        style={{ textAlignLast: 'center' }}
                        onChange={handleDisasterChange}
                        disabled={!status}
                        className={`bg-[#2c2f32] text-white p-2 rounded-md border ${status ? 'border-gray-600' : 'border-gray-800 opacity-50'
                            } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                        <option value="" disabled hidden>
                            -- Select a disaster --
                        </option>
                        {disasterOptions.map((option, index) => (
                            <option key={index} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>

                </div>
            </div>
        </div>
    );
};

export default Dropdown;


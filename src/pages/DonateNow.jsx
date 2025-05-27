import React, { useState, useEffect } from 'react'

import { DisplayCampaigns } from '../components';
import { useStateContext } from '../context'
import { daysLeft } from '../utils';

const DonateNow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [displayType, setDisplayType] = useState('active'); // 'active' or 'expired'

  const { address, contract, getCampaigns } = useStateContext();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const data = await getCampaigns();
    setCampaigns(data);
    setIsLoading(false);
  }

  useEffect(() => {
    if(contract) fetchCampaigns();
  }, [address, contract]);

  const activeCampaigns = campaigns.filter(campaign => parseInt(daysLeft(campaign.deadline)) > 0);
  const expiredCampaigns = campaigns.filter(campaign => parseInt(daysLeft(campaign.deadline)) <= 0);

  return (
    <div className="pr-8">
      <div className="flex justify-start mb-5">
        <div className="flex bg-[#1c1c24] rounded-[10px] overflow-hidden">
          <button 
            className={`px-4 py-2 font-epilogue font-semibold text-[14px] leading-[22px] ${displayType === 'active' ? 'bg-[#4acd8d] text-white' : 'bg-[#28282e] text-[#808191]'}`}
            onClick={() => setDisplayType('active')}
          >
            Active
          </button>
          <button 
            className={`px-4 py-2 font-epilogue font-semibold text-[14px] leading-[22px] ${displayType === 'expired' ? 'bg-[#4acd8d] text-white' : 'bg-[#28282e] text-[#808191]'}`}
            onClick={() => setDisplayType('expired')}
          >
            Expired
          </button>
        </div>
      </div>

      <DisplayCampaigns 
        title={displayType === 'active' ? "Active Campaigns" : "Expired Campaigns"}
        isLoading={isLoading}
        campaigns={displayType === 'active' ? activeCampaigns : expiredCampaigns}
      />
    </div>
  )
}

export default DonateNow

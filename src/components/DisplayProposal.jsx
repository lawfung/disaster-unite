import React, { useState , useEffect, useRef} from 'react';
import DisasterCard from './DisasterCard';
import { loader } from '../assets';
import Dropdown from './Dropdown';
import { useStateContext } from '../context';
  import {ProposalStructure, ProposalContent} from '../components';





const DisplayProposal = ({ title}) => {
  const [selectedDisasterId, setSelectedDisasterId] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [displayType, setDisplayType] = useState('All');
  const proposalContentRef = useRef();
    const [selectedProposalId, setSelectedProposalId] = useState(null);
    const [disaster_status, set_disaster_status] =   useState('Active'); 
    const [showModal, setShowModal] = useState(false);
  const { address, getProposals} = useStateContext();
    const reversedProposals = proposals.slice().reverse();

  


    useEffect(() => {
      if (selectedDisasterId && displayType) {
        setLoading(true);
        getProposals(selectedDisasterId, displayType).then((result) => {
          setProposals(result);
          setLoading(false);
        });
      }
    }, [selectedDisasterId, displayType]);

            
  const currentIndex = reversedProposals.findIndex(p => p.proposal_id === selectedProposalId);


  return (
    <div>
      <div className="mb-6">
        <div className="mb-4"> 
        <Dropdown
          onSelect={({status ,disasterId }) => {
          setSelectedDisasterId(disasterId);
          set_disaster_status(status);
          
        }}        /> 
       </div>
        
      </div>
        {/* Status filter tabs */}
          <div className="flex justify-start mb-5">
            
            <div className="flex bg-[#1c1c24] rounded-[10px] overflow-hidden mb-4">
                <button 
                className={`px-4 py-2 font-epilogue font-semibold text-[14px] leading-[22px] ${displayType === 'All' ? 'bg-[#4acd8d] text-white' : 'bg-[#28282e] text-[#808191]'}`}

                onClick={() => setDisplayType('All')}
              >
                All Proposal
              </button>

                {disaster_status !== "Expired" && (
                    <>
                      <button 
                        className={`px-4 py-2 font-epilogue font-semibold text-[14px] leading-[22px] ${displayType === 'Ongoing' ? 'bg-[#4acd8d] text-white' : 'bg-[#28282e] text-[#808191]'}`}
                        onClick={() => setDisplayType('Ongoing')}
                      >
                        Ongoing Proposal
                      </button>
                      {address && (
                        <>
                          <button 
                            className={`px-4 py-2 font-epilogue font-semibold text-[14px] leading-[22px] ${displayType === 'Votable' ? 'bg-[#4acd8d] text-white' : 'bg-[#28282e] text-[#808191]'}`}
                            onClick={() => setDisplayType('Votable')}
                          >
                            Votable Proposal
                          </button>
                          <button 
                            className={`px-4 py-2 font-epilogue font-semibold text-[14px] leading-[22px] ${displayType === 'Voted' ? 'bg-[#4acd8d] text-white' : 'bg-[#28282e] text-[#808191]'}`}
                            onClick={() => setDisplayType('Voted')}
                          >
                            Voted Proposal
                          </button>
                        </>
                      )}
                    </>
                  )}
            </div>
            <div className="flex items-center ml-8">
                <h1 className="font-epilogue font-semibold text-[18px] text-white text-center">
                {proposals.length} proposals found
                  </h1>
            </div>
          </div>

      

      <div className="flex flex-wrap mt-[20px] gap-[26px]">
        {isLoading && (
          <img src={loader} alt="loader" className="w-[100px] h-[100px] object-contain" />
        )}

        {!isLoading && proposals.length === 0 && (
          <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-[#818183]">
          No matching proposals. 
          </p>
        )}


        {/* Main content */}       
        {!isLoading && reversedProposals.map((proposal, index) => (
          <DisasterCard
            key={`campaign-${index}`}
            {...proposal}
            onClick={() => {
                setSelectedProposalId(proposal.proposal_id);
                setShowModal(true);
              }}
          />
        ))}
      </div>





      {showModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 overflow-auto flex justify-center items-start pt-20">
            <div className="relative w-full max-w-[1000px] bg-[#1e1e1e] rounded-xl p-6">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full z-20"
              >
                ✕
              </button>
              {/* 左箭頭，fixed 貼齊螢幕左邊 */}
            <button
              onClick={() => {
                if (currentIndex > 0) setSelectedProposalId(reversedProposals[currentIndex - 1].proposal_id);
              }}
              disabled={currentIndex === 0}
              style={{
                position: 'fixed',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 60,
                opacity: currentIndex === 0 ? 0.3 : 1,
              }}
              className="w-12 h-12 flex items-center justify-center text-white text-3xl bg-white/10 hover:bg-white/20 rounded-r-full"
            >
              ‹
            </button>
            {/* 右箭頭，fixed 貼齊螢幕右邊 */}
            <button
              onClick={() => {
                if (currentIndex < proposals.length - 1) setSelectedProposalId(reversedProposals[currentIndex + 1].proposal_id);
              }}
              disabled={currentIndex === proposals.length - 1}
              style={{
                position: 'fixed',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 60,
                opacity: currentIndex === proposals.length - 1 ? 0.3 : 1,
              }}
              className="w-12 h-12 flex items-center justify-center text-white text-3xl bg-white/10 hover:bg-white/20 rounded-l-full"
            >
              ›
            </button>
            {/* Proposal內容加ref */}
            <div ref={proposalContentRef}>
              <ProposalStructure id={selectedProposalId}>
                <ProposalContent id={selectedProposalId} />
              </ProposalStructure>
            </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default DisplayProposal;


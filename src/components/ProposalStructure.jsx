import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useStateContext } from '../context';

const ProposalStructure = ({id, children }) => {
    const containerRef = useRef();
       const [position, setPosition] = useState({
        left: 0,
        top: 0,
        height: 0,
        width: 0,
    });
    const { address , proposalVoting, getProposalVoteRecord } = useStateContext();


    const [voteLoading, setVoteLoading] = useState(false);
    const [voteStatus, setVoteStatus] = useState({
        voted: false,
        voteType: null, // true: approve, false: reject
      });
    

    const handleAction = async (action) => {
      if (!address) {
        alert("Please connect your wallet first.");
        return;
      }
      if (!id) {
        toast.error("Invalid proposal ID.");
        return;
      }

      setVoteLoading(true);
      try {
        if (action === "support") {
          await proposalVoting(id, true);
          const result = await getProposalVoteRecord(id, address);
          setVoteStatus(result);
          
        } else if (action === "reject") {
          await proposalVoting(id, false);
          const result = await getProposalVoteRecord(id, address);
          setVoteStatus(result);

        }
      } catch (e) {
        alert("proposal voting has some problem")
      }
      setVoteLoading(false);
    };


    useEffect(() => {
        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const absoluteTop = rect.top + window.scrollY;

                setPosition({
                    left: rect.left,
                    bottom: rect.bottom,           // ✅ 修正後的 top
                    height: rect.height,
                    width: rect.width,
                }); 
            }
        };
        updatePosition();
    }, []);

    // 初始化讀取投票紀錄
      useEffect(() => {
        const fetchVoteStatus = async () => {
          if (address && id) {
            const result = await getProposalVoteRecord(id, address);
            setVoteStatus(result);
          }
        };
        fetchVoteStatus();
      }, [address, id, getProposalVoteRecord]);


    return (
        <div className="bg-[#121212] text-white min-h-screen">
            
           
            {/* Support / Reject 按鈕：容器正下方中央 */}
                <div
                  className="fixed flex gap-4 z-50"
                  style={{
                    top: window.innerHeight - 80,
                    left: position.left + position.width / 2,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {voteStatus.voted ? (
                    <div className="text-lg font-semibold">
                      {voteStatus.voteType ? (
                        <span className= "text-white bg-[#1dc071] px-4 py-2 rounded-full font-semibold">You voted Support</span>
                      ) : (
                        <span className="text-white bg-[#f04438] px-4 py-2 rounded-full font-semibold">You voted Reject</span>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        className="bg-[#1dc071] hover:bg-green-700 px-6 py-2 rounded-full font-semibold"
                        onClick={() => handleAction("support")}
                        disabled={voteLoading}
                      >
                        {voteLoading ? "Voting..." : "Support"}
                      </button>
                      <button
                        className="bg-[#f04438] hover:bg-red-700 px-6 py-2 rounded-full font-semibold"
                        onClick={() => handleAction("reject")}
                        disabled={voteLoading}
                      >
                        {voteLoading ? "Voting..." : "Reject"}
                      </button>
                    </>
                  )}
                </div>
  
            {/* 中央內容容器 */}
            <div
                ref={containerRef}
                className="relative w-full max-w-5xl mx-auto bg-[#1e1e1e] p-10 rounded-lg"
            >
                {children}
            </div>
        </div>
    );
};

export default ProposalStructure;


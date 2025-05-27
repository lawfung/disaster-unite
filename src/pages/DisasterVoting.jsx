import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';
import abi from '../contract/abi.json';
import contractAddress from '../contract/address.json';
import { useContract, useAddress } from '@thirdweb-dev/react';

const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.infura.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/"
];

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%232d3748'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23a0aec0'%3ENo Image Available%3C/text%3E%3C/svg%3E";

const VoteDisaster = () => {
  const [voted, setVoted] = useState({});
  const [modalInfo, setModalInfo] = useState({ open: false, disasterId: null, disasterName: '', vote: null });
  const [votableRequests, setVotableRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [finalizingRequests, setFinalizingRequests] = useState({});
  
  const { contract } = useContract(contractAddress.toString(), abi);
  const address = useAddress();

  useEffect(() => {
    const checkAdminStatus = async () => {
      
      if (!address) {
        setIsLoading(true);
        return;
      }

      if (!contract) {
        setIsLoading(true);
        return;
      }

      try {
        const adminStatus = await contract.call("admins", [address]);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          toast.error("Only admins can vote");
          setIsLoading(false);
          return;
        }

        try {
          const requests = await contract.call("getVotableRequests", [address]);
          
          if (!requests || !Array.isArray(requests)) {
            console.warn("No votable requests returned from contract.");
            setVotableRequests([]);
            setIsLoading(false);
            return;
          }

          // Check voting status for each request
          const requestsWithVoteStatus = await Promise.all(requests.map(async (request) => {
            const hasVoted = await contract.call("requestHasVoted", [request.id, address]);
            const voteType = hasVoted ? await contract.call("requestVoteType", [request.id, address]) : null;
            return {
              ...request,
              hasVoted,
              voteType
            };
          }));

          const formattedRequests = requestsWithVoteStatus.map(request => ({
            id: request.id.toString(),
            title: request.title,
            description: request.description,
            proposer: request.proposer,
            ended: request.ended,
            approveVotes: request.approveVotes.toString(),
            rejectVotes: request.rejectVotes.toString(),
            votingDeadline: new Date(request.votingDeadline.toNumber() * 1000).toLocaleString(),
            residualAddress: request.residualAddress,
            hasVoted: request.hasVoted,
            voteType: request.voteType,
            photoCid: request.photoCid || request.cid
          }));
          
          setVotableRequests(formattedRequests);
        } catch (requestError) {
          console.error("Error fetching votable requests:", requestError);
          toast.error(requestError.reason || "Error fetching votable requests");
          setVotableRequests([]);
        }
      } catch (error) {
        console.error("Detailed error:", {
          message: error.message,
          reason: error.reason,
          code: error.code,
          data: error.data
        });
        toast.error(error.reason || "Error checking admin status");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [contract, address]);

  const handleVoteClick = (disasterId, disasterName, vote) => {
    setModalInfo({ open: true, disasterId, disasterName, vote });
  };

  const confirmVote = async () => {
    const { disasterId, vote } = modalInfo;
    
    if (isVoting) {
      return;
    }

    if (!contract) {
      toast.error("Contract not initialized");
      setModalInfo({ open: false, disasterId: null, disasterName: '', vote: null });
      return;
    }

    setIsVoting(true);
    try {
      // First check if user has already voted
      const hasVoted = await contract.call("requestHasVoted", [disasterId, address]);
      if (hasVoted) {
        toast.error("You have already voted for this request");
        setModalInfo({ open: false, disasterId: null, disasterName: '', vote: null });
        return;
      }

      // Attempt to send the transaction
      const tx = await contract.call("voteRequest", [disasterId, vote === "accept"]);
      
      // Show pending toast
      toast.info("Transaction submitted, waiting for confirmation...");
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Update local state
        setVoted(prev => ({ ...prev, [disasterId]: vote }));
        
        // Update votableRequests with new vote status
        setVotableRequests(prev => 
          prev.map(req => {
            if (req.id === disasterId) {
              const newApproveVotes = vote === "accept" 
                ? (parseInt(req.approveVotes) + 1).toString() 
                : req.approveVotes;
              const newRejectVotes = vote === "reject" 
                ? (parseInt(req.rejectVotes) + 1).toString() 
                : req.rejectVotes;
              
              return {
                ...req,
                hasVoted: true,
                voteType: vote === "accept",
                approveVotes: newApproveVotes,
                rejectVotes: newRejectVotes
              };
            }
            return req;
          })
        );
        
        setModalInfo({ open: false, disasterId: null, disasterName: '', vote: null });
        toast.success("Vote submitted successfully!");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Voting error:", {
        message: error.message,
        reason: error.reason,
        code: error.code,
        data: error.data
      });
      
      // Handle specific error cases
      if (error.message?.includes("user rejected")) {
        toast.error("Transaction was rejected");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for gas");
      }
      
      // Close modal on error
      setModalInfo({ open: false, disasterId: null, disasterName: '', vote: null });
    } finally {
      setIsVoting(false);
    }
  };

  const handleFinalize = async (requestId) => {
    if (finalizingRequests[requestId]) {
      return;
    }

    if (!contract) {
      toast.error("Contract not initialized");
      return;
    }

    // Find the request to check if it's already ended
    const request = votableRequests.find(req => req.id === requestId);
    if (!request) {
      toast.error("Request not found");
      return;
    }

    if (request.ended) {
      toast.error("This request has already been finalized");
      return;
    }

    setFinalizingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      // Attempt to send the transaction
      const tx = await contract.call("finalizeDisaster", [requestId]);
      
      // Show pending toast
      toast.info("Transaction submitted, waiting for confirmation...");
      
      // For ThirdWeb, we don't need to wait for the transaction
      // The transaction is already confirmed when contract.call resolves
      
      // Update votableRequests to remove the finalized request
      setVotableRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success("Disaster request finalized successfully!");
      
    } catch (error) {
      console.error("Finalization error:", {
        message: error.message,
        reason: error.reason,
        code: error.code,
        data: error.data
      });
      
      // Handle specific error cases
      if (error.message?.includes("user rejected")) {
        toast.error("Transaction was rejected");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for gas");
      } else if (error.message?.includes("Only admins can finalize")) {
        toast.error("Only admins can finalize a disaster");
      } else if (error.message?.includes("Already finalized")) {
        toast.error("This request has already been finalized");
      } else {
        toast.error(error.reason || "Error finalizing disaster request");
      }
    } finally {
      setFinalizingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-white text-2xl font-bold mb-6">Vote on Disasters</h1>
        <div className="bg-[#1c1c24] text-white p-6 rounded-lg">
          {!address ? (
            <p>You need to connect your wallet first.</p>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-white text-2xl font-bold mb-6">Vote on Disasters</h1>
        <div className="bg-[#1c1c24] text-white p-6 rounded-lg">
          <p>You need to be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">Vote on Disasters</h1>

      {votableRequests.length === 0 ? (
        <div className="bg-[#1c1c24] text-white p-6 rounded-lg">
          <p>No votable requests available at the moment.</p>
        </div>
      ) : (
        votableRequests.map(request => {
          const imageUrl = request.photoCid ? `${IPFS_GATEWAYS[0]}${request.photoCid}` : DEFAULT_IMAGE;
          const hasVoted = request.hasVoted || voted[request.id];
          const voteType = request.voteType;
          
            return (
            <div key={request.id} className="bg-[#1c1c24] text-white p-6 rounded-lg mb-4">
              <div className="flex gap-6">
              <div className="w-1/3">
                <img 
                src={imageUrl}
                alt={request.title}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  console.log("Image load error for:", imageUrl);
                  e.target.onerror = null;
                  e.target.src = DEFAULT_IMAGE;
                }}
                />
              </div>
              <div className="w-2/3">
                <h2 className="text-xl font-semibold">{request.title}</h2>
                <p className="text-sm my-2">{request.description}</p>
                <div className="grid grid-cols-1 gap-4 mb-4">
                {/* <div>
                  <p className="text-sm text-gray-400">Proposer:</p>
                  <p className="text-sm break-all">{request.proposer}</p>
                </div> */}
                <div>
                  <p className="text-sm text-gray-400">Voting Deadline:</p>
                  <p className="text-sm">{request.votingDeadline}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <p className="text-sm text-gray-400">Approve Votes:</p>
                  <p className="text-sm text-green-500">{request.approveVotes}</p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-400">Reject Votes:</p>
                  <p className="text-sm text-red-500">{request.rejectVotes}</p>
                  </div>
                </div>
                </div>
                <div className="flex flex-col gap-6 mt-3">
                <div className="flex gap-4">
                  <button
                  disabled={hasVoted}
                  onClick={() => handleVoteClick(request.id, request.title, "accept")}
                  className={`px-4 py-2 rounded ${
                    hasVoted 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : voteType === true 
                      ? 'bg-green-600' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  >
                  👍 Agree {hasVoted && voteType === true && '(Voted)'}
                  </button>
                  <button
                  disabled={hasVoted}
                  onClick={() => handleVoteClick(request.id, request.title, "reject")}
                  className={`px-4 py-2 rounded ${
                    hasVoted 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : voteType === false 
                      ? 'bg-red-600' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  >
                  👎 Disagree {hasVoted && voteType === false && '(Voted)'}
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => handleFinalize(request.id)}
                    disabled={finalizingRequests[request.id] || request.ended}
                    className={`font-epilogue font-semibold text-[16px] leading-[26px] text-white min-h-[42px] px-4 rounded-[10px] w-full ${
                      finalizingRequests[request.id] || request.ended
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-[#8c6dfd] hover:bg-[#6b4fc9] transition-colors duration-150'
                    }`}
                  >
                    {finalizingRequests[request.id] ? 'Finalizing...' : 'Finalize'}
                  </button>
                </div>
                </div>
              </div>
              </div>
            </div>
            );
        })
      )}

      <ConfirmModal
        isOpen={modalInfo.open}
        onClose={() => {
          if (!isVoting) {
            setModalInfo({ open: false, disasterId: null, disasterName: '', vote: null });
          }
        }}
        onConfirm={confirmVote}
        title={`You sure you want to vote for disaster #${modalInfo.disasterId} ${modalInfo.disasterName} to be「${modalInfo.vote === "accept" ? "Agree" : "Disagree"}」?`}
        isLoading={isVoting}
        disabled={isVoting}
      />
    </div>
  );
};

export default VoteDisaster;

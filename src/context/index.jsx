import React, { useContext, createContext } from 'react';
import contractAddress from '../contract/address.json'
import abi from '../contract/abi.json'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAddress, useContract, useMetamask, useContractWrite, ChainId } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract, isLoading, error } = useContract(contractAddress,abi);
  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form) => {
    try {
      
      const data = await createCampaign({args:[
        address, // owner
        form.title, // title
        form.description, // description
        form.target,
        new Date(form.deadline).getTime() , // deadline,
        form.image
      ]})
      
      toast.success('Campaign created successfully.');
      console.log("contract call success", data)
    } catch (error) {
      toast.error('Error while creating Campaign, please try again');
      console.log("contract call failure", error)
    }
  }

  const updateCampaign = async (form) => {
    try {
      const data = await contract.call('updateCampaign', [
        form.id, // campaign id
        form.title, // title
        form.description, // description
        form.target,
        new Date(form.deadline).getTime() , // deadline,
        form.image
      ])
      toast.success('Campaign updated successfully.');
      console.log("contract call success", data)
    } catch (error) {
      toast.error('Error while creating Campaign, please try again');
      console.log("contract call failure", error)
    }
  }


  const deleteCampaign = async (pId) => {
    try {
      const data = await contract.call('deleteCampaign', [pId])
      
      toast.success('Campaign deleted successfully.');
      console.log("contract call success", data)
      return data;
    } catch (error) {
      toast.error('Error while deleting Campaign, please try again');
      console.log("contract call failure", error)
    }
  }

  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns');

    const parsedCampaings = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }));

    return parsedCampaings;
  }
    //Dropdown 查詢使用
    const getDisasters = async (status) => {
      let rawdisasters;
      let disasters;
      if (status === 'Active') {
        rawdisasters = await contract.call("getOngoingDisaster");
      } else if (status === 'Expired') {
        rawdisasters = await contract.call("getDueDisaster");
      } else if (status === 'Votable') {
        rawdisasters = await contract.call("getVotableDisaster", [address]);

        disasters = await Promise.all(
        rawdisasters.map(async (id) => {
                const p = await contract.call("disasters", [id]);
                return {
                    id: p[0].toString(),
                    name: p[1]
                };
            })
        );
        return disasters;
      } 

        console.log("[getDisaster] Fetched disasterIds:", rawdisasters); 
        disasters = rawdisasters.map((d) => ({
            id: d[0].toString(),   // BigNumber to string
            name: d[1]
          }));
        return disasters;
    };

    //小卡用
    const getProposals = async(disasterId, status) =>{
        let proposalIds;
        if (status == "Ongoing"){
            proposalIds = await contract.call("getOngoingProposal", [disasterId]);
        } 
        else if(status == "Votable"){
           proposalIds = await contract.call("getUnvoteProposal", [disasterId, address]);
        }
        else if( status == "Voted"){
            proposalIds = await contract.call("getVotedProposal", [disasterId, address])
        }
        else if (status ==='All'){
            const proposals = await contract.call("getProposalList", [disasterId]);
            const result = proposals.map((p) => ({
                proposal_id: p[0].toString(),
                title: p[2],
                photoCid: p[3],
                description: p[4],
                amount: ethers.utils.formatEther(p[6].toString()),
                proposer_addr: p[7],
                dueDate : p[11].toNumber()
            }));
            return result;        
        }

        console.log("proposalIds:", proposalIds)
        if (!proposalIds || proposalIds.length === 0) {
            return [];
        }

        const proposals = await Promise.all(
            proposalIds.map(async (id) => {
              const p = await contract.call("proposals", [id]);

              return {
                proposal_id: id.toString(),
                title: p[2],
                photoCid: p[3],
                description: p[4],
                amount: ethers.utils.formatEther(p[6].toString()),
                proposer_addr: p[7],
                dueDate : p[11].toNumber()
              };
            })
          );

          return proposals;
    }

    //proposal投票用
    const getDetailedProposal = async(proposalId) =>{
        const p = await contract.call("proposals", [proposalId]);
        const disasterId = p[1].toString();
        const d = await contract.call("disasters", [disasterId]);
   
             
        const result =  {
                propodal_id: proposalId.toString(),
                disasterId: disasterId,
                disasterName: d[1],
                title: p[2],
                photoCid: p[3],
                description: p[4],
                proofCid: p[5],
                amount: ethers.utils.formatEther(p[6].toString()),
                proposer_addr: p[7],
                approved: p[8],
                totalVotes: d[6].toNumber(),        
                approveVotes: p[9].toNumber(),
                rejectVotes: p[10].toNumber(),
                dueDate : p[11].toNumber(),
              }; 
        console.log("s[8] = ", result);
        return result;

    }
    //Finalize
    const finalize = async(proposalId) =>{
        const confirm = window.confirm("Are you sure you want to finalize? Funds will be sent to the proposer.");
          if (!confirm) {
            return;
          }
        try {
            const tx = await contract.call("finalizeProposal", [proposalId]);
            alert("✅ Finalized successfully! ETH is being transferred to the target account.");
        } catch (err) {
            // 分析錯誤訊息內容
            const message = err?.message || "";
            
            if (message.includes("Already approved")) {
              alert("❌ Already approved");
            } else if (message.includes("Not enough votes")) {
              alert("❌ Approval votes did not exceed 50%, or total votes were less than 1%.");
            } else if (message.includes("Insufficient funds")) {
              alert("❌ Insufficient funds");
            } else {
              console.error("Finalize 發生未知錯誤：", err);
              alert("❌ System error. Try later!");
            }
          }
    }

    //Vote Proposal 
     const proposalVoting = async(proposalId, approve) =>{
        try {
            const tx = await contract.call("voteProposal", [proposalId, approve]);
            toast.success("Vote submitted successfully!");           
        } catch (error) {
            const reason = error.reason || error.message || "";
            if (reason.includes("Voting period ended")) {
              toast.error("Voting period has ended.");
            } else if (reason.includes("Already voted")) {
              toast.error("You have already voted on this proposal.");
            } else if (reason.includes("No voting power for this disaster")) {
              toast.error("You have no voting power for this disaster.");
            } else {
              toast.error("An unexpected error occurred.");
            }
          } 
    }

    //Proposal voted record
     const getProposalVoteRecord = async (proposalId) => {
          try {
            const hasVoted = await contract.call("proposalHasVoted", [proposalId, address]);

            if (!hasVoted) {
              return { voted: false, voteType: null };
            }

            const voteType = await contract.call("proposalVoteType", [proposalId, address]);
            return { voted: true, voteType }; // voteType: true = 同意, false = 反對
          } catch (error) {
            const reason = error.reason || error.message || "";

            if (reason.includes("execution reverted")) {
              toast.error("Smart contract execution reverted.");
            } else {
              toast.error("Failed to fetch vote record.");
            }

            return { voted: false, voteType: null };
          }
        };




  const payOutToCampaignTeam = async (pId) => {
    try {
      const data = await contract.call('payOutToCampaignTeam', [pId]);
      toast.success('Campaign funds successfully withdrawed.');
      return data;
    } catch(err) {
      toast.error("Error occured while withdrawing funds.");
      console.log("Error occured while withdrawing funds", err);
    }
  }

  const getDonations = async (pId) => {
    const donations = await contract.call('getDonators', [pId]);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for(let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      })
    }

    return parsedDonations;
  }

  const getDisasterList = async () => {
    try {
      const result = await contract.call('getDisasterList');
      console.log('Raw disaster list:', result);
      
      // Format the list for the Select component
      const formattedList = result.map((disaster, index) => ({
        value: index.toString(), // Use index as value
        label: disaster[1], // Use the disaster name as label
        id: disaster[0].toString(), // Keep the original ID
        image: disaster[2], // Keep the image CID
        // Add other fields if needed
      }));

      return {
        id: result.length,
        list: formattedList
      };
    } catch (error) {
      console.error('Error fetching disaster list:', error);
      return { id: 0, list: [] };
    }
  };

  const submitDisasterProposal = async (form) => {
    try {
      console.log('Submitting proposal with form data:', form);
      
      const data = await contract.call('submitProposal', [
        form.disaster.id, // disasterId
        form.title, // title
        ethers.utils.parseEther(form.amount), // amount
        form.description, // description
        form.previewIpfsHash, // photoCid
        form.evidenceIpfsHash, // proofCid
      ]);

      toast.success('Proposal submitted successfully!');
      console.log('Proposal submission success:', data);
      return data;
    } catch (error) {
      toast.error('Error submitting proposal. Please try again.');
      console.error('Error submitting proposal:', error);
      throw error;
    }
  };

  return (
    <StateContext.Provider
      value={{ 
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getDonations,
        payOutToCampaignTeam,
        updateCampaign,
        deleteCampaign,
        getDisaster: getDisasters,
        getProposals,
        getDetailedProposal,
        getDisasterList,
        submitDisasterProposal,
        finalize,
        proposalVoting,
        getProposalVoteRecord
      }}
    >
      <ToastContainer />
      {children}
    </StateContext.Provider>
  )
}

export const useStateContext = () => useContext(StateContext);

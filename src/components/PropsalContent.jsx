import React, { useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import { useStateContext } from '../context';
import { CountBox, CustomButton, Loader, VotePieChart } from '../components';
import { calculateBarPercentage, daysLeft } from '../utils';
import { thirdweb } from '../assets';
import CountdownTimer from '../components/CountdownTimer';
import { toast } from 'react-toastify';



const ProposalContent = ({ id }) => {
    //API
    const { getDetailedProposal, contract, finalize} = useStateContext();

    const [proposal, setProposal] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
        const fetchProposal = async () => {
          try {
            const data = await getDetailedProposal(id);
            setProposal(data);
          } catch (err) {
            console.error('Failed to fetch proposal', err);
          } finally {
            setIsLoading(false);
          }
        };

        if (id) fetchProposal();
      }, [id, contract]);

    if (isLoading || !proposal) return <Loader />; 

    const remainingDays = daysLeft(proposal.dueDate*1000);

    return (
        <div>
            {isLoading && <Loader />}
            <h1 className="font-epilogue font-bold text-[28px] text-white mb-2">
                {proposal.title}
            </h1>
            <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">

                {/*圖片顯示處*/}
                <div className="flex-1 flex-col">
                    <img src={`https://ipfs.io/ipfs/${proposal.photoCid}`} alt="campaign" className="w-full h-[410px] object-cover rounded-xl" />
                    <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2">
                        <div className="absolute h-full bg-[#4acd8d]" style={{ width: `${calculateBarPercentage(proposal.target, proposal.amountCollected)}%`, maxWidth: '100%' }}>
                        </div>
                    </div>
                </div>
                {/*上右側顯示欄*/}
                <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
                    <CountdownTimer title="Left" targetDate={proposal.dueDate*1000} /> 
                    {/*  <CountBox title="Days Left" value={remainingDays} />  */}
                    <CountBox title={`Required ETH`} value={proposal.amount} />
                    <VotePieChart supportCount={proposal.approveVotes} rejectCount={proposal.rejectVotes} totalEligible={proposal.totalVotes} />
                </div>
            </div>

            <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
                <div className="flex-[2] flex flex-col gap-[40px]">
                    <div>
                        <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Creator</h4>

                        <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
                            <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                                <img src={thirdweb} alt="user" className="w-[60%] h-[60%] object-contain" />
                            </div>
                            <div>
                                <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">{proposal.proposer_addr}</h4>
                                <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#808191]"></p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Story</h4>

                        <div className="mt-[20px]">
                            <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">{proposal.description}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">All SUPPORTING FILES</h4>
                        <div className="mt-[20px]">
                            <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${proposal.proofCid}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="font-epilogue font-normal text-[16px] text-[#4acd8d] leading-[26px] underline hover:opacity-80"
                                >
                                  See more details
                                </a>

                            </p>
                        </div>


                    </div>

                </div>


                {/*start*/}
                <div className="flex-1">
                    <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Finalize Proposal	</h4>
                    {/*Finalize*/}
                    <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
                        
                        <div className="mt-[30px]">
                            
                            <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px]">
                                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white">Disclaimer</h4>
                                <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-[#808191]">You can only receive the funds if one day has passed since the proposal was created, more than 1% of users have voted, and over 50% have agreed.
                                    Otherwise, the proposal will be automatically rejected and you will not receive any ETH.</p>
                            </div>
                            <CustomButton
                                btnType="button"
                                title="Finalize"
                                styles="w-full bg-[#8c6dfd]"
                                handleClick={() => finalize(id)}
                            /> <br /><br />
                            
                        </div>
                    </div>
                </div>
                {/*end*/}
            </div>
        </div>
    )
}

export default ProposalContent



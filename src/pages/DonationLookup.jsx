import { useEffect, useState } from 'react';
import { ethers } from "ethers";
import abi from '../contract/abi.json'
import contractAddress from '../contract/address.json'

/*------------------------------------ variables ------------------------------------*/

const NO_ETHEREUM_ERR = 'Please install MetaMask or another Web3 wallet';

/*------------------------------------ functions ------------------------------------*/

const get_myDonations = async () => {

    if (window.ethereum) {

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        const userAddress = await signer.getAddress();

        const donations = await contract.getMyDonations(userAddress);

        const items = donations.map((donation) => ({
            id: donation.disasterId,
            title: donation.name,
            donationAddress: donation.donateAddress,
            image: `https://gateway.pinata.cloud/ipfs/${donation.photoCid}`,
            totalAmount : ethers.utils.formatEther(donation.total_amount),
            votePer : ethers.utils.formatEther(donation.vote_per)
        }));
        return items;
    } else {

        const items = [];
        return items;
    }
};


/*------------------------------------ react dom ------------------------------------*/
const DonationLookup = () => {

    const [items, setItems] = useState([]);
    const [errorModalMsg, setErrorModalMsg] = useState('');

    const checkEthereum = () => {

        if (!window.ethereum)
            setErrorModalMsg(NO_ETHEREUM_ERR);
    }

    const initialize_items = async () => {

        const data = await get_myDonations();
        setItems(data);
    };

    useEffect(() => {
        checkEthereum();
        initialize_items();
    }, []);

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-6xl text-white mb-6">My Donation</h1>


            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {items.map((item) => (

                    <div key={item.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                        <h2 className="text-center font-bold text-4xl mb-4">{item.title}</h2>
                        <img
                            src={item.image}
                            alt={item.title}
                            className="h-48 object-contain mb-4"
                        />
                        <div className="p-4 flex flex-col gap-4 items-center">
                            <div className="flex justify-center">
                                <div className="w-full max-w-xs text-left space-y-3">
                                    {/* 捐款地址 */}
                                    <div className="mb-2">
                                        <strong>Donation Address : </strong>
                                        <div className="break-all ml-4 text-center">{item.donationAddress}</div>
                                    </div>

                                    {/* 捐款金額 */}
                                    <div className="mb-2">
                                        <strong>Donation Amount : </strong>
                                        <div className="break-all ml-4 text-center">${item.totalAmount} ETH</div>
                                    </div>

                                    {/* 投票份額 */}
                                    <div className="mb-2">
                                        <strong>Voting Power : </strong>
                                        <div className="break-all ml-4 text-center">{item.votePer}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 錯誤彈窗 */}
            {!!errorModalMsg && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-4 rounded max-w-sm w-full">
                        <p className='text-lg'>{errorModalMsg}</p>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setErrorModalMsg('')} className="px-4 py-2 border rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    )
}

export default DonationLookup
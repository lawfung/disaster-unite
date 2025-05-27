import { useEffect, useState } from 'react';
import { ethers } from "ethers";
import abi from '../contract/abi.json'
import contractAddress from '../contract/address.json'

/*------------------------------------ variables ------------------------------------*/

// error msg
const NO_ETHEREUM_ERR = 'Please install MetaMask or another Web3 wallet';
const LOGIN_FAIL_ERR = 'Please connect your wallet first';
const TX_FAIL_ERR = 'Transaction failed';
const NO_NUMBER_ERR = 'Please enter a valid donation amount';
const TOO_SMALL_AMOUNT_ERR = 'Please enter a valid donation amount (at least 0.000000000000000001 ETH).';

// status code
const TX_SUCCESS_CODE = 1;
const TX_FAIL_CODE = 0;


/*------------------------------------ functions ------------------------------------*/
const get_disasterList = async () => {

    if (window.ethereum) {

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        const disasters = await contract.getOngoingDisaster();

        const items = disasters.map((disaster) => ({
            id: disaster.id,
            title: disaster.name,
            donationAddress: disaster.residualAddress,
            image: `https://gateway.pinata.cloud/ipfs/${disaster.photoCid}`,
            balance: disaster.balance / 1e18
        }));
        return items;
    } else {

        const items = [];
        return items;
    }
};
const donate = async (disaster_id, amount) => {

    if (window.ethereum) {

        try{
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);


            // 金額檢查
            if (!amount || isNaN(amount) || parseFloat(amount) < 0.000000000000000001) {
                return {
                    _tx_status: false,
                    _error_msg: TOO_SMALL_AMOUNT_ERR
                };
            }

            // 轉換 ETH 金額為 wei
            const value = ethers.utils.parseEther(amount.toString());
            // 呼叫 payable 函式
            const tx = await contract.donate(disaster_id, { value });

            // 等待交易上鏈（成功與否會反映在 receipt.status）
            const receipt = await tx.wait();

            const gasUsed = receipt.gasUsed;
            const effectiveGasPrice = receipt.effectiveGasPrice; // for EIP-1559

            const gasFeeEth = ethers.utils.formatEther(gasUsed.mul(effectiveGasPrice));


            const result = {
                _tx_status : receipt.status === TX_SUCCESS_CODE,
                _tx_hash : tx.hash,
                _gas_fee : gasFeeEth
            }
            return result;
        }catch(error){

            const result = {
                _tx_status : false,
                _error_msg : TX_FAIL_ERR
            }
            console.log("error : ", error);
            return result;
        }

    } else {

        const result = {
            _tx_status : false,
            _error_msg : NO_ETHEREUM_ERR
        }
        return result;
    }
}


/*------------------------------------ react dom ------------------------------------*/
const Donation = () => {

    const [items, setItems] = useState([]);
    const [amounts, setAmounts] = useState({});
    const [donateModalId, setDonateModalId] = useState(null);
    const [showDonate, setShowDonate] = useState(false);
    const [showDonateSuccess, setShowDonateSuccess] = useState(false);
    const [errorModalMsg, setErrorModalMsg] = useState('');
    const [accountAddress, setAccountAddress] = useState('');
    const [txHash, setTxHash] = useState('');
    const [gasFee, setGasFee] = useState(0);

    const checkEthereum = () => {

        if (!window.ethereum)
            setErrorModalMsg(NO_ETHEREUM_ERR);
    }
    const getWalletAddress = async () => {

        if (window.ethereum) {

            try {
                // 要求用戶連接錢包
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                // 返回第一個帳號（通常是使用者目前選取的帳號）
                setAccountAddress(accounts[0]);
                return 0;
            } catch (error) {

                setErrorModalMsg(LOGIN_FAIL_ERR);
                return -1;
            }
        } else {
            setErrorModalMsg(NO_ETHEREUM_ERR);
            return -1;
        }
    }

    const initialize_items = async () => {

        const data = await get_disasterList();
        setItems(data);
    };

    const handleAmountChange = (id, value) => {
        setAmounts((other) => ({
            ...other,
            [id]: value,
        }));
    };

    const currentItem = items.find((item) => item.id === donateModalId);

    const handleDonateButtonClick = async (item) => {

        if (accountAddress === '') {
            const login = await getWalletAddress();
            if(login < 0)
                return;
        }

        const inputAmount = amounts[item.id];

        if (!inputAmount || parseFloat(inputAmount) <= 0) {
            setErrorModalMsg(NO_NUMBER_ERR);
            return;
        }

        // 都檢查通過，開啟確認視窗
        setDonateModalId(item.id);
        setShowDonate(true);
    };

    const handleDonate = async ()=>{


        const disaster_id = currentItem.id;
        const amount = amounts[currentItem.id];
        const tx_result = await donate(disaster_id, amount);

        if (tx_result._tx_status){
            setTxHash(tx_result._tx_hash);
            setGasFee(tx_result._gas_fee);
            setShowDonateSuccess(true);
        }else{
            setErrorModalMsg(tx_result._error_msg);
        }
    };


    useEffect(() => {
        checkEthereum();
        initialize_items();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-6xl text-white mb-6">Donation</h1>
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
                                    <div className="mb-2">
                                        <strong>remaining balance : </strong>
                                        <div className="break-all ml-4 text-center">{item.balance} ETH</div>
                                    </div>

                                    {/* 捐款金額 */}
                                    <div className="mb-2">
                                        <strong>Donation Amount : </strong>
                                        <input
                                            type="number"
                                            placeholder="輸入金額"
                                            step="0.001"
                                            className="border border-gray-300 rounded px-2 py-1 w-32 mt-2"
                                            value={amounts[item.id] || ''}
                                            onChange={(e) => handleAmountChange(item.id, e.target.value)}
                                        />
                                        &nbsp;ETH
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto text-right">
                            <button
                                onClick={() => handleDonateButtonClick(item)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Donate
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 捐款確認彈窗 */}
            {showDonate && currentItem && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-bold">Are you sure you want to donate?</h2>
                            <button onClick={() => setShowDonate(false)}>✕</button>
                        </div>

                        <div className="text-center">
                            <h5 className="mb-4 font-bold text-4xl">{currentItem.title}</h5>
                            <img src={currentItem.image} alt={currentItem.title} className="mb-4 max-h-48 mx-auto" />
                            <div className="text-left text-base">
                                <p><strong>Donation Address : </strong> {currentItem.donationAddress}</p>
                                <p><strong>Wallet Address : </strong> {accountAddress}</p>
                                <p><strong>Donation Amount :</strong> ${amounts[currentItem.id]} ETH</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowDonate(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={() => { setShowDonate(false); handleDonate(); }} className="px-4 py-2 bg-green-600 text-white rounded">Confirm Donation</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 捐款成功彈窗 */}
            {showDonateSuccess && currentItem && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-bold">Donation Successful</h2>
                            <button onClick={() => { setShowDonateSuccess(false); setDonateModalId(null); }}>✕</button>
                        </div>
                        <div className="text-center">
                            <h5 className="mb-4 font-bold text-4xl">{currentItem.title}</h5>
                            <img src={currentItem.image} alt={currentItem.title} className="mb-4 max-h-48 mx-auto" />
                            <div className="text-left text-base">
                                <p><strong>Donation Address : </strong> {currentItem.donationAddress}</p>
                                <p><strong>Wallet Address : </strong> {accountAddress}</p>
                                <p><strong>Donation Amount : </strong> ${amounts[currentItem.id]} ETH</p>
                                <p><strong>Transaction Hash : </strong> {txHash}</p>
                                <p><strong>gas fee : </strong> {gasFee}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

export default Donation
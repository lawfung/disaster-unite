import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';

import { CustomButton, FormField, Loader } from '../components';
import { money } from '../assets';
import { DisasterResponseAddress, DisasterResponseABI } from '../constants';
import { useStateContext } from '../context';

// Get Pinata credentials from environment variables
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

const STAKE_AMOUNT = 0.01; // ETH
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

const AddDisaster = () => {
  const navigate = useNavigate();
  const { address, connect, contract } = useStateContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    walletAddress: '',
    imageIpfsHash: ''
  });

  const [fileData, setFileData] = useState({
    imageFile: null,
    uploadStatus: ''
  });

  const deadlineTimestamp = Date.now() + ONE_DAY_MS;
  const voteDeadlineTimestamp = Date.now() + SEVEN_DAYS_MS;
  const voteDeadlineString = new Date(voteDeadlineTimestamp).toLocaleString();

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const onImageFileChange = (event) => {
    const file = event.target.files[0];
    setFileData(prev => ({
      ...prev,
      imageFile: file,
      uploadStatus: ''
    }));
    setForm(prev => ({ ...prev, imageIpfsHash: '' }));
  };

  const uploadToIPFS = async (file) => {
    if (!file) {
      setFileData(prev => ({ ...prev, uploadStatus: 'Please select a file first' }));
      return;
    }

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      setFileData(prev => ({ 
        ...prev, 
        uploadStatus: 'Error: Pinata API credentials not found. Please check your .env file.' 
      }));
      console.error('Pinata credentials missing:', {
        apiKey: PINATA_API_KEY ? 'Present' : 'Missing',
        secretKey: PINATA_SECRET_KEY ? 'Present' : 'Missing'
      });
      return;
    }

    try {
      setFileData(prev => ({ ...prev, uploadStatus: 'Uploading to IPFS...' }));
      
      const formData = new FormData();
      formData.append('file', file);

      // 檢查文件大小
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File size exceeds 10MB limit');
      }

      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      console.log('Attempting to upload to Pinata...');
      console.log('API Key:', PINATA_API_KEY.substring(0, 5) + '...');
      console.log('Secret Key:', PINATA_SECRET_KEY.substring(0, 5) + '...');

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (!response.data || !response.data.IpfsHash) {
        throw new Error('Invalid response from Pinata API');
      }

      const ipfsHash = response.data.IpfsHash;
      setForm(prev => ({ ...prev, imageIpfsHash: ipfsHash }));
      setFileData(prev => ({ ...prev, uploadStatus: 'Upload successful!' }));
      
      console.log('IPFS Hash:', ipfsHash);
      console.log('View file at:', `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      
      let errorMessage = 'Upload failed: ';
      
      if (error.response) {
        // 服務器回應了錯誤狀態碼
        console.error('Error response:', error.response.data);
        errorMessage += `Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`;
      } else if (error.request) {
        // 請求發送但沒有收到回應
        console.error('No response received:', error.request);
        errorMessage += 'No response from server. Please check your internet connection.';
      } else {
        // 請求設置時發生錯誤
        errorMessage += error.message;
      }

      setFileData(prev => ({ 
        ...prev, 
        uploadStatus: errorMessage
      }));
    }
  };

  const onImageUpload = () => {
    uploadToIPFS(fileData.imageFile);
  };

  const PreviewImage = ({ file, ipfsHash }) => {
    if (!file) return null;

    const previewUrl = ipfsHash 
      ? `https://ipfs.io/ipfs/${ipfsHash}`
      : URL.createObjectURL(file);

    return (
      <div className="preview-container">
        <img 
          src={previewUrl} 
          alt="Preview" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '200px', 
            objectFit: 'contain',
            margin: '10px 0',
            borderRadius: '4px'
          }} 
        />
      </div>
    );
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionError('');
      
      // 檢查是否安裝了 MetaMask
      if (typeof window.ethereum === 'undefined') {
        setConnectionError('請安裝 MetaMask 錢包擴展');
        return;
      }

      // 嘗試連接錢包
      await connect();
      
      // 檢查是否在 Sepolia 測試網
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia 的 chainId
        setConnectionError('請切換到 Sepolia 測試網');
        return;
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setConnectionError(error.message || '連接錢包時發生錯誤');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address) {
      alert('請先連接錢包');
      return;
    }

    if (!contract) {
      alert('合約未初始化，請重新連接錢包');
      return;
    }

    if (!form.imageIpfsHash) {
      alert('請上傳災難相關圖片');
      return;
    }

    const confirm = window.confirm(
      `請確認以下資訊：\n` +
      `災難名稱：${form.name}\n` +
      `描述：${form.description}\n` +
      `質押金額：${STAKE_AMOUNT} ETH\n` +
      `剩餘資金接收地址：${form.walletAddress}\n\n` +
      `是否送出？`
    );

    if (!confirm) return;

    setIsLoading(true);

    try {
      // Convert stake amount to Wei (0.01 ETH = 10^16 Wei)
      const stakeAmountWei = ethers.utils.parseEther(STAKE_AMOUNT.toString());

      console.log('Contract address:', DisasterResponseAddress);
      console.log('Contract ABI:', DisasterResponseABI);
      console.log('Account:', address);
      console.log('Submitting disaster request:', {
        title: form.name,
        photoCid: form.imageIpfsHash,
        description: form.description,
        residualAddress: form.walletAddress,
        stakeAmount: stakeAmountWei.toString()
      });

      // Call the addRequest function with the correct parameters and value
      const tx = await contract.call('addRequest', [
        form.name,
        form.imageIpfsHash,
        form.description,
        form.walletAddress
      ], {
        value: stakeAmountWei, // Send 0.01 ETH with the transaction
        gasLimit: 500000 // Add explicit gas limit
      });

      console.log('Transaction sent:', tx.receipt.transactionHash);
      alert('交易已發送，等待確認...');
      
      // Wait for transaction confirmation using ThirdWeb's method
      const receipt = await tx.receipt;
      console.log('Transaction confirmed:', receipt);

      alert('災難請求已成功提交！');
      setIsLoading(false);
      navigate('/');
    } catch (error) {
      console.error('Error submitting disaster request:', error);
      let errorMessage = '提交失敗：';
      
      if (error.message.includes('Must stake 0.01 ETH')) {
        errorMessage += '質押金額必須為 0.01 ETH';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += '錢包餘額不足';
      } else {
        errorMessage += error.message || '未知錯誤';
      }
      
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <Loader />}
      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px]">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">
          Add Disaster
        </h1>
      </div>

      {!address ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <p className="text-white text-lg mb-4">請先連接錢包</p>
          {connectionError && (
            <p className="text-red-500 mb-4">{connectionError}</p>
          )}
          <CustomButton
            btnType="button"
            title={isConnecting ? "連接中..." : "連接錢包"}
            styles="bg-[#8c6dfd]"
            handleClick={handleConnect}
            disabled={isConnecting}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full mt-[65px] flex flex-col gap-[30px]">
          <div className="flex justify-end">
            <p className="text-white">
              已連接錢包: {address.substring(0, 6)}...{address.substring(38)}
            </p>
          </div>

          <FormField
            labelName="Disaster Name *"
            placeholder="e.g., Red Cross"
            inputType="text"
            value={form.name}
            handleChange={(e) => handleFormFieldChange('name', e)}
          />

          <FormField
            labelName="Description *"
            placeholder="Describe the disaster and needed relief"
            isTextArea
            value={form.description}
            handleChange={(e) => handleFormFieldChange('description', e)}
          />

          <FormField
            labelName="Wallet Address *"
            placeholder="Enter the wallet address"
            inputType="text"
            value={form.walletAddress}
            handleChange={(e) => handleFormFieldChange('walletAddress', e)}
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <input type="file" onChange={onImageFileChange} className="text-white" accept="image/*"/>
              <button 
                type="button"
                onClick={onImageUpload} 
                className="bg-[#8c6dfd] text-white px-4 py-2 rounded-lg"
              >
                Upload Image
              </button>
              <br />
              <label className="text-white">Please upload a disaster-related image (jpg, png)</label>
              <div className="bg-[#5d5f6f] text-black p-4 rounded-lg">
                {fileData.imageFile && (
                  <div>
                    <p>File Name: {fileData.imageFile.name}</p>
                    <p>File Type: {fileData.imageFile.type}</p>
                    {form.imageIpfsHash && (
                      <div>
                        <p>IPFS Hash (CID): {form.imageIpfsHash}</p>
                        <p>View on IPFS: <a href={`https://ipfs.io/ipfs/${form.imageIpfsHash}`} target="_blank" rel="noopener noreferrer">View Image</a></p>
                      </div>
                    )}
                    {fileData.uploadStatus && <p>Status: {fileData.uploadStatus}</p>}
                  </div>
                )}
                <PreviewImage file={fileData.imageFile} ipfsHash={form.imageIpfsHash} />
              </div>
            </div>
          </div>

          <div className="w-full flex justify-start items-center p-4 bg-[#8c6dfd] min-h-[120px] rounded-[10px] flex-col gap-2">
            <div className="flex items-center">
              <img src={money} alt="money" className="w-[40px] h-[40px] object-contain mr-3" />
              <h4 className="font-epilogue font-bold text-[18px] text-white">
                You will stake <span className="text-yellow-300">{STAKE_AMOUNT} ETH</span>
              </h4>
            </div>
            <p className="text-white text-sm mt-2">
              Voting ends on <span className="text-green-400 font-semibold">{voteDeadlineString}</span>
            </p>
          </div>

          <div className="flex justify-center items-center mt-[40px]">
            <CustomButton
              btnType="submit"
              title="Submit Disaster"
              styles="bg-[#1dc071]"
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default AddDisaster;

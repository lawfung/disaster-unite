import React from 'react';
import '../styles/index.css';
import '../styles/popup.css';
import Select from 'react-select';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { useStateContext } from '../context';

// Get Pinata credentials from environment variables
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

// Constants
const VOTE_PERIOD_DAYS = 7;

const ApplicationSubmit = () => {
  const { getDisasterList, submitDisasterProposal, address, connect } = useStateContext();
  const [disasterOptions, setDisasterOptions] = useState([]);

  useEffect(() => {
    const fetchDisasters = async () => {
      const result = await getDisasterList();
      console.log('Disaster List Response:', result);
      const { id, list } = result;
      console.log('Disaster ID:', id);
      console.log('Disaster List:', list);
      setDisasterOptions(list);
    };
    fetchDisasters();
  }, [getDisasterList]);

  // Form data structure
  const [formData, setFormData] = useState({
    disaster: null,
    title: '',
    amount: '',
    description: '',
    previewIpfsHash: '',
    evidenceIpfsHash: '',
    applicantAddress: address || "xxxxxx123xxxxxxx",
    submissionDate: new Date().toISOString(),
  });

  // Update applicant address when wallet connects
  useEffect(() => {
    if (address) {
      updateFormData('applicantAddress', address);
    }
  }, [address]);

  // Separate state for file handling
  const [fileData, setFileData] = useState({
    previewFile: null,
    evidenceFile: null,
    previewUploadStatus: '',
    evidenceUploadStatus: '',
  });

  const updateFormData = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const updateFileData = (field, value) => {
    setFileData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const logging = () => {
    const voteEndDate = new Date(formData.submissionDate);
    voteEndDate.setDate(voteEndDate.getDate() + VOTE_PERIOD_DAYS);

    console.log('Form Data:', {
      disaster: formData.disaster,
      title: formData.title,
      amount: parseFloat(formData.amount),
      description: formData.description,
      previewIpfsHash: formData.previewIpfsHash,
      evidenceIpfsHash: formData.evidenceIpfsHash,
      applicantAddress: formData.applicantAddress,
      submissionDate: formData.submissionDate,
      voteEndDate: voteEndDate.toISOString(),
    });
  }

  const onPreviewFileChange = (event) => {
    const file = event.target.files[0];
    updateFileData('previewFile', file);
    updateFileData('previewUploadStatus', '');
    updateFormData('previewIpfsHash', '');
  };

  const onEvidenceFileChange = (event) => {
    const file = event.target.files[0];
    updateFileData('evidenceFile', file);
    updateFileData('evidenceUploadStatus', '');
    updateFormData('evidenceIpfsHash', '');
  };

  const uploadToIPFS = async (file, setIpfsHash, setUploadStatus) => {
    if (!file) {
      setUploadStatus('Please select a file first');
      return;
    }

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      setUploadStatus('Error: Pinata API credentials not found. Please check your .env file.');
      console.error('Pinata credentials missing:', {
        apiKey: PINATA_API_KEY ? 'Present' : 'Missing',
        secretKey: PINATA_SECRET_KEY ? 'Present' : 'Missing'
      });
      return;
    }

    try {
      setUploadStatus('Uploading to IPFS...');
      
      const formData = new FormData();
      formData.append('file', file);

      console.log('Attempting to upload to Pinata...');
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY
          }
        }
      );

      const ipfsHash = response.data.IpfsHash;
      setIpfsHash(ipfsHash);
      setUploadStatus('Upload successful!');
      
      console.log('IPFS Hash:', ipfsHash);
      console.log('View file at:', `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    } catch (error) {
      console.error('Error uploading to IPFS:', error.response?.data || error.message);
      setUploadStatus(`Upload failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const onPreviewUpload = () => {
    uploadToIPFS(
      fileData.previewFile, 
      (hash) => updateFormData('previewIpfsHash', hash),
      (status) => updateFileData('previewUploadStatus', status)
    );
  };

  const onEvidenceUpload = () => {
    uploadToIPFS(
      fileData.evidenceFile,
      (hash) => updateFormData('evidenceIpfsHash', hash),
      (status) => updateFileData('evidenceUploadStatus', status)
    );
  };

  const fileDataDisplay = (file, ipfsHash, uploadStatus) => {
    if (file) {
      return (
        <div>
          <h2>File Details:</h2>
          <p>File Name: {file.name}</p>
          <p>File Type: {file.type}</p>
          {ipfsHash && (
            <div>
              <p>IPFS Hash (CID): {ipfsHash}</p>
              <p>View on IPFS: <a href={`https://ipfs.io/ipfs/${ipfsHash}`} target="_blank" rel="noopener noreferrer">View File</a></p>
            </div>
          )}
          {uploadStatus && <p>Status: {uploadStatus}</p>}
        </div>
      );
    } else {
      return (
        <div>
          <h4>Choose before Pressing the Upload button</h4>
        </div>
      );
    }
  };

  const PreviewMedia = ({ file, ipfsHash }) => {
    if (!file) return null;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const previewUrl = ipfsHash 
      ? `https://ipfs.io/ipfs/${ipfsHash}`
      : URL.createObjectURL(file);

    if (isImage) {
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
    } else if (isVideo) {
      return (
        <div className="preview-container">
          <video 
            controls
            style={{ 
              maxWidth: '100%', 
              maxHeight: '200px', 
              objectFit: 'contain',
              margin: '10px 0',
              borderRadius: '4px'
            }}
          >
            <source src={previewUrl} type={file.type} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    return null;
  };

  const validateForm = () => {
    const missingFields = [];
    
    if (!address) {
      missingFields.push('Please connect your wallet first');
    }
    if (!formData.disaster) missingFields.push('Disaster Type');
    if (!formData.title) missingFields.push('Title');
    if (!formData.amount) missingFields.push('Amount');
    if (!formData.description) missingFields.push('Description');
    if (!fileData.previewFile) missingFields.push('Preview Image/Video');
    if (!fileData.evidenceFile) missingFields.push('Evidence');
    if (!formData.previewIpfsHash) missingFields.push('Please upload Preview Image/Video to IPFS');
    if (!formData.evidenceIpfsHash) missingFields.push('Please upload Evidence to IPFS');
    
    return missingFields;
  };

  const handleSubmit = () => {
    const missingFields = validateForm();
    if (missingFields.length > 0) {
      return false;
    }
    return true;
  };

  const submitForm = async () => {
    if (!handleSubmit()) {
      return;
    }

    try {
      // Update applicant address if not set
      if (formData.applicantAddress === "xxxxxx123xxxxxxx" && address) {
        updateFormData('applicantAddress', address);
      }

      // Submit the proposal to the smart contract
      await submitDisasterProposal(formData);
      
      // Log the submission
      logging();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="text-white p-6 space-y-6">
      {!address && (
        <div className="bg-yellow-500 text-white p-4 rounded-lg mb-4">
          Please connect your wallet to submit a proposal
          <button 
            onClick={connect} 
            className="ml-4 bg-white text-yellow-500 px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Connect Wallet
          </button>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-white block">Disaster: 
          <Select 
            options={disasterOptions}
            value={formData.disaster}
            onChange={(disaster) => updateFormData('disaster', disaster)} 
            className="mt-1 w-full"
            isDisabled={!address}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "#363951",
                color: "#ffffff",
                borderColor: "#4b4e6d",
                opacity: !address ? 0.5 : 1,
              }),
              singleValue: (base) => ({
                ...base,
                color: "#ffffff",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#2c2f45", 
                color: "#ffffff",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused 
                  ? "#4b4e6d"        
                  : "#2c2f45",       
                color: "#ffffff",
                cursor: "pointer",
              }),
              placeholder: (base) => ({
                ...base,
                color: "#cccccc",
              }),
              input: (base) => ({
                ...base,
                color: "#ffffff",
              }),
            }}
          />                                                                                                                     
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-white block">
          Application Title: 
          <input
            value={formData.title}
            onChange={e => updateFormData('title', e.target.value)}
            type="text"
            className="bg-[#363951] text-white mt-1 w-full p-2 rounded"
            disabled={!address}
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-white block">
          Application Amount: 
          <input
            value={formData.amount}
            onChange={e => updateFormData('amount', e.target.value)}
            type="number"
            className="bg-[#363951] text-white mt-1 w-full p-2 rounded"
            disabled={!address}
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-white block">
          Other Additional Note: 
          <input
            value={formData.description}
            onChange={e => updateFormData('description', e.target.value)}
            type="text"
            className="bg-[#363951] text-white mt-1 w-full p-2 rounded"
            disabled={!address}
          />
        </label>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <input 
            type="file" 
            onChange={onPreviewFileChange} 
            className="text-white"
            disabled={!address}
          />
          <button 
            onClick={onPreviewUpload} 
            className="bg-[#8c6dfd] text-white px-4 py-2 rounded-lg"
            disabled={!address || !fileData.previewFile}
          >
            Upload
          </button>
          <br />
          <label className="text-white">Please upload your preview media ( jpg, png, mp4 ... ) here</label>
          <div className="bg-[#5d5f6f] text-black">
            {fileDataDisplay(fileData.previewFile, formData.previewIpfsHash, fileData.previewUploadStatus)}
          </div>
        </div>

        <div className="space-y-2">
          <input 
            type="file" 
            onChange={onEvidenceFileChange} 
            className="text-white"
            disabled={!address}
          />
          <button 
            onClick={onEvidenceUpload} 
            className="bg-[#8c6dfd] text-white px-4 py-2 rounded-lg"
            disabled={!address || !fileData.evidenceFile}
          >
            Upload
          </button>
          <br />
          <label className="text-white">Please upload your evidence ( zip, 7z ... ) here</label>
          <div className="bg-[#5d5f6f] text-black">
            {fileDataDisplay(fileData.evidenceFile, formData.evidenceIpfsHash, fileData.evidenceUploadStatus)}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Popup
          trigger={
            <button 
              className="button bg-[#8c6dfd] text-white px-4 py-2 rounded-lg"
              disabled={!address}
            > 
              Submit 
            </button>
          }
          modal
          nested
          overlayClassName="popup-overlay"
        >
          {close => {
            const missingFields = validateForm();
            if (missingFields.length > 0) {
              return (
                <div className="modal warning-modal bg-[#1c1c24] text-white">
                  <div className="content">
                    <h2>Missing Information</h2>
                    <p>Please fill in all required fields:</p>
                    <ul>
                      {missingFields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                    <div className="actions">
                      <button
                        className="button bg-[#8c6dfd] text-white px-4 py-2 rounded-lg"
                        onClick={close}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="modal bg-[#1c1c24] text-white rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="content p-0 overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold">Submit Confirmation</h2>
                  </div>
                  
                  <div className="px-6 pb-6 space-y-6">
                    <div className="bg-[#2c2c2c] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Application Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Disaster Type</span>
                          <span className="font-medium">{formData.disaster.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Title</span>
                          <span className="font-medium">{formData.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Amount</span>
                          <span className="font-medium">{formData.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Voting End Date</span>
                          <span className="font-medium">
                            {new Date(new Date(formData.submissionDate).getTime() + VOTE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Applicant Address</span>
                          <span className="font-medium break-all ml-2">{formData.applicantAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#2c2c2c] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Preview Media</h3>
                      <div className="space-y-3">
                        <PreviewMedia file={fileData.previewFile} ipfsHash={formData.previewIpfsHash} />
                        {formData.previewIpfsHash ? (
                          <a 
                            href={`https://ipfs.io/ipfs/${formData.previewIpfsHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#8c6dfd] hover:text-[#7b5dfd] flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            View on IPFS
                          </a>
                        ) : (
                          <p className="text-gray-400">No preview uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 p-6 sticky bottom-0">
                    <button
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      onClick={close}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 bg-[#8c6dfd] hover:bg-[#7b5dfd] text-white rounded-lg transition-colors"
                      onClick={() => {
                        submitForm();
                        close();
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            );
          }}
        </Popup>
      </div>
    </div>
  )
}

export default ApplicationSubmit;

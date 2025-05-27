import { createCampaign, dashboard, logout, payment, profile, withdraw, vote } from '../assets';
import abi from '../contract/abi.json'
import contractAddress from '../contract/address.json'

export const navlinks = [
  {
    name: 'Introduction',
    imgUrl: dashboard,
    link: '/introduction',
    id: 1
  },
  {
    name: 'Donation',
    imgUrl: payment,
    submenu: [
      { name: "Donate", link: '/donation' },
      { name: "My Donation", link: '/donation-lookup' }
    ]
  },

  {
    name: 'Application',
    imgUrl: createCampaign,
    submenu: [
      { name: "Disaster Application", link: '/add-disaster' },
      { name: "Proposal Application", link: '/application' }
    ]
  },
    {
    name: 'Voting',
    imgUrl: vote,
    submenu: [
      { name: "Disaster Voting", link: '/disaster-voting' },
      { name: "Proposal Voting", link: '/proposal-voting' }
    ]
  },
  ];

export const DisasterResponseAddress = contractAddress.contractAddress;
export const DisasterResponseABI = abi;

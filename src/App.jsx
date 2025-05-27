import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { Sidebar, Navbar } from './components';
import { CampaignDetails, AddDisaster, UpdateCampaign, ProposalVoting, ProposalDetails, ApplicationSubmit, DonationLookup, DisasterVoting, Introduction, DonateNow, Donation } from './pages';

const App = () => {
  return (
    <div className="relative sm:-8 p-4 bg-[#13131a] min-h-screen flex flex-row ">
      <div className="sm:flex hidden mr-2 relative md:basis-1/4">
        <Sidebar />
      </div>

      <div className="flex-1 max-sm:w-full md:basis-3/6 mx-auto sm:pr-20 max-w-[1080px]">
        <Navbar />

        <Routes>
          <Route path="/" element={<Introduction />} />
          <Route path="/add-disaster" element={<AddDisaster />} />
          <Route path="/campaign-details/:id" element={<CampaignDetails />} />
          <Route path="/campaign-update/:id" element={<UpdateCampaign />} />
          <Route path="/proposal-voting" element={<ProposalVoting />} />
          <Route path="/proposal-details/:id" element={<ProposalDetails />} />
          <Route path="/application" element={<ApplicationSubmit />} />
          <Route path="/donation-lookup" element={<DonationLookup />} />
          <Route path="/disaster-voting" element={<DisasterVoting />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/donate-now" element={<DonateNow />} />
          <Route path="/donation" element={<Donation />} />
        </Routes>
      </div>
    </div>
  )
}

export default App

import React, { useEffect } from 'react';
import { CustomButton } from '../components';
import { useNavigate } from 'react-router-dom';

const Introduction = () => {
  const navigate = useNavigate();

  // 添加页面进入动画效果
  useEffect(() => {
    const sections = document.querySelectorAll('.animate-section');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
      observer.observe(section);
    });
    
    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="bg-[#13131a] min-h-screen flex flex-col items-center p-4 sm:p-10 relative overflow-hidden">
      {/* 背景动态元素 */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#1dc071] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-80 h-80 bg-[#8c6dfd] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-[#1dc071] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="max-w-[1080px] w-full bg-[#1c1c24] rounded-[20px] p-6 sm:p-10 shadow-2xl border border-[#3a3a43] backdrop-blur-sm relative z-10 animate-section transition-all duration-700 opacity-0 translate-y-10" style={{
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      }}>
        <h1 className="font-epilogue font-bold text-[30px] sm:text-[45px] text-center mb-10" 
            style={{
              background: 'linear-gradient(to right, #8c6dfd, #1dc071, #8c6dfd)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient 5s linear infinite',
            }}>
          Empowering Humanitarian Aid Through Blockchain
        </h1>

        <div className="space-y-10">
          {/* About Section */}
          <section className="border-b border-[#3a3a43] pb-8 animate-section transition-all duration-700 opacity-0 translate-y-10">
            <h2 className="font-epilogue font-bold text-[24px] text-white mb-6 flex items-center">
              <span className="inline-block w-2 h-10 bg-gradient-to-b from-[#1dc071] to-[#8c6dfd] mr-4 rounded-full"></span>
              About Donation DApp
            </h2>
            <div className="pl-6 border-l-2 border-[#3a3a43] hover:border-[#1dc071] transition-all duration-300">
              <p className="font-epilogue font-normal text-[16px] text-[#e0e0e6] leading-7 transform hover:translate-x-1 transition-all duration-300">
                Donation DApp is a decentralized application built on blockchain technology with the goal of bringing 
                transparency and trust to the world of charitable giving. Our platform allows donors to track exactly 
                how their contributions are utilized and ensures that funds reach those who need them most.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section className="border-b border-[#3a3a43] pb-8 animate-section transition-all duration-700 opacity-0 translate-y-10">
            <h2 className="font-epilogue font-bold text-[24px] text-white mb-6 flex items-center">
              <span className="inline-block w-2 h-10 bg-gradient-to-b from-[#8c6dfd] to-[#1dc071] mr-4 rounded-full"></span>
              Our Mission
            </h2>
            <div className="bg-gradient-to-r from-[#1c1c24] to-[#2a2a35] p-6 rounded-[15px] shadow-inner transform hover:scale-[1.01] transition-all duration-300" 
                style={{boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'}}>
              <p className="font-epilogue font-normal text-[16px] text-[#e0e0e6] leading-7">
                We aim to revolutionize how donations work by eliminating middlemen and ensuring full transparency 
                through blockchain technology. Every transaction is recorded on the blockchain, making it immutable 
                and publicly verifiable.
              </p>
              <div className="mt-4 text-right">
                <span className="inline-block px-4 py-1 bg-[#1dc071] rounded-full text-white text-sm">100% Transparent</span>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="border-b border-[#3a3a43] pb-8 animate-section transition-all duration-700 opacity-0 translate-y-10">
            <h2 className="font-epilogue font-bold text-[24px] text-white mb-6 flex items-center">
              <span className="inline-block w-2 h-10 bg-gradient-to-b from-[#1dc071] to-[#8c6dfd] mr-4 rounded-full"></span>
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="bg-[#13131a] p-6 rounded-[15px] border-l-4 border-[#1dc071] shadow-lg transform hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-300">
                <h3 className="font-epilogue font-semibold text-[18px] text-white mb-3">Disaster Reporting</h3>
                <p className="font-epilogue font-normal text-[16px] text-[#e0e0e6] leading-7">
                  If you discover a new disaster that is not yet listed on our platform, you can submit a request 
                  to add it. Our internal reviewers will assess the evidence and determine whether the disaster 
                  qualifies for fundraising.
                </p>
              </div>
              <div className="bg-[#13131a] p-6 rounded-[15px] border-l-4 border-[#8c6dfd] shadow-lg transform hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-300">
                <h3 className="font-epilogue font-semibold text-[18px] text-white mb-3">Donor Participation & Governance</h3>
                <p className="font-epilogue font-normal text-[16px] text-[#e0e0e6] leading-7">
                  As a donor, you can choose to contribute to any verified disaster campaign and, in return, 
                  receive voting rights proportional to your donations. Use your voting power to help decide 
                  which relief proposals receive funding, ensuring accountability and effective resource allocation.
                </p>
              </div>
              <div className="bg-[#13131a] p-6 rounded-[15px] border-l-4 border-[#1dc071] shadow-lg transform hover:translate-y-[-5px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-300">
                <h3 className="font-epilogue font-semibold text-[18px] text-white mb-3">Smart Contract Disbursement</h3>
                <p className="font-epilogue font-normal text-[16px] text-[#e0e0e6] leading-7">
                  When responders submit proposals with proof of their relief efforts, they go through a Web3-based DAO 
                  voting mechanism. Once approved, funds are automatically disbursed through smart contracts, ensuring 
                  immediate deployment of resources exactly where they're needed most.
                </p>
              </div>
            </div>
          </section>

          {/* Join Community Section */}
          <section className="animate-section transition-all duration-700 opacity-0 translate-y-10">
            <h2 className="font-epilogue font-bold text-[24px] text-white mb-6 flex items-center">
              <span className="inline-block w-2 h-10 bg-gradient-to-b from-[#8c6dfd] to-[#1dc071] mr-4 rounded-full"></span>
              Join Our Global Community
            </h2>
            <div className="bg-gradient-to-r from-[#13131a] via-[#1c1c24] to-[#13131a] p-6 rounded-[15px] border border-[#3a3a43] shadow-xl mb-8"
                style={{boxShadow: '0 15px 30px rgba(0, 0, 0, 0.4)'}}>
              <p className="font-epilogue font-normal text-[16px] text-[#e0e0e6] leading-7 mb-6">
                By participating in Donation DApp, you become part of a global community committed to making 
                positive change through transparent giving. Your contributions can make a real difference, 
                and you'll always know exactly how your funds are being used. You can participate by donations,
                voting on proposals, or even submitting disaster reports to help us identify new areas in need.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-[#1dc071] to-[#0ba761] rounded-full text-white text-sm animate-pulse">✓ 100% Transparency</span>
                <span className="px-3 py-1 bg-gradient-to-r from-[#8c6dfd] to-[#7357d6] rounded-full text-white text-sm animate-pulse" style={{animationDelay: '0.3s'}}>✓ Community Governance</span>
                <span className="px-3 py-1 bg-gradient-to-r from-[#1dc071] to-[#0ba761] rounded-full text-white text-sm animate-pulse" style={{animationDelay: '0.6s'}}>✓ Direct Impact</span>
                <span className="px-3 py-1 bg-gradient-to-r from-[#8c6dfd] to-[#7357d6] rounded-full text-white text-sm animate-pulse" style={{animationDelay: '0.9s'}}>✓ Zero Intermediaries</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* 添加全局CSS动画样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .animate-section.show {
            opacity: 1;
            transform: translateY(0);
          }
          
          /* 确保即使没有JS动画也能看到内容 */
          @media (prefers-reduced-motion) {
            .animate-section {
              opacity: 1 !important;
              transform: translateY(0) !important;
              transition: none !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default Introduction;
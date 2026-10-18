import React from 'react';
import { useStore } from '../../context/StoreContext';
import { BookOpen, ShieldCheck, Heart, Users, Award, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setActivePage } = useStore();

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Hero Banner */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#71883F] text-white flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-[#71883F] uppercase tracking-wider block">
            About Fathima Stores
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
            Quality Stationery and Everyday Essentials
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-xl mx-auto leading-relaxed">
            Founded with a commitment to providing genuine school and office supplies at affordable prices, Fathima Stores has grown to serve thousands of students, teachers, artists and local businesses.
          </p>
        </div>

        {/* Narrative Section */}
        <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-6 sm:p-10 space-y-4 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
          <h2 className="text-lg font-bold text-[#171717]">Our Mission & Heritage</h2>
          <p>
            At Fathima Stores, we believe every student deserves high quality tools for learning. A reliable pen that doesn't blot, smooth paper that inspires neat handwriting, and accurate drawing instruments make a real difference in academic confidence.
          </p>
          <p>
            We curate authentic merchandise directly from legendary manufacturers like Classmate, Camlin, Faber-Castell, Casio, Solo, and Cello. Every single item in our catalog is verified for paper GSM, break-resistant leads, and ergonomic durability before it is packed for dispatch.
          </p>
        </div>

        {/* 3 Core Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border border-[#E8E8E3] rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#171717]">100% Genuine Brands</h3>
            <p className="text-xs text-[#6B6B6B]">
              Direct factory partnerships guarantee genuine stationery with manufacturer warranty.
            </p>
          </div>

          <div className="border border-[#E8E8E3] rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#171717]">Affordable Everyday Pricing</h3>
            <p className="text-xs text-[#6B6B6B]">
              No inflated margins. Honest prices and student exam season discounts year-round.
            </p>
          </div>

          <div className="border border-[#E8E8E3] rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#171717]">Community Trust</h3>
            <p className="text-xs text-[#6B6B6B]">
              Over 1,000+ satisfied learners and businesses served across Kerala and India.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setActivePage('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Explore Our Products
          </button>
        </div>

      </div>
    </div>
  );
};

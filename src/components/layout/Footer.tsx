'use client';

import {  Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import Image from 'next/image';
export default function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              
              <span className="text-2xl font-bold">
                <Image
                          src="/logo.webp"
                          alt="Gym Background"
                          width={100}
                          height={96}
                        />
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Transform your body and mind with our state-of-the-art facilities, 
              expert trainers, and supportive community. Your fitness journey starts here.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
              <Twitter className="h-6 w-6 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
              <Instagram className="h-6 w-6 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
              <Youtube className="h-6 w-6 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#membership" className="text-gray-400 hover:text-white transition-colors">Membership</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Classes</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Personal Training</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Nutrition</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Marine Drive,Raipur, India</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>gotmefit@gmail.com</span>
              </li>
            </ul>
            
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">Hours</h4>
              <p className="text-gray-400 text-sm">12/7 Access for Members</p>
              <p className="text-gray-400 text-sm">Staff: Mon-Fri 6AM-10PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2025 GotMeFit Gym Management. All rights reserved. Made in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
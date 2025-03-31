'use client';

import { useState, KeyboardEvent, type ReactElement } from 'react';
import { MapPin, Building2, Phone, Mail, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';

interface Department {
  name: string;
  description: string;
  programs: string[];
  features: string[];
  vision: string;
  mission: string;
}

const departments: Department[] = [
  {
    name: "Computer Science",
    description: "The Department of Computer Science at FCIT is committed to excellence in teaching, research, and community service. Our programs prepare students for successful careers in computing and technology, with a strong foundation in theoretical and practical aspects of computer science.",
    programs: [
      "Bachelor of Computer Science",
      "Master of Computer Science",
      "PhD in Computer Science"
    ],
    features: [
      "Advanced Computing Laboratories",
      "Research in AI and Machine Learning",
      "Software Development Projects",
      "Competitive Programming Teams",
      "Industry Partnerships"
    ],
    vision: "To be a leading department in computer science education and research in the region",
    mission: "To provide high-quality education and research opportunities in computer science, preparing graduates for successful careers and contributing to technological advancement"
  },
  {
    name: "Information Technology",
    description: "The Department of Information Technology focuses on preparing professionals who can design, implement, and manage IT solutions. Our curriculum combines theoretical knowledge with practical skills, preparing students for the digital transformation era.",
    programs: [
      "Bachelor of Information Technology",
      "Master of Information Technology"
    ],
    features: [
      "Network and Security Labs",
      "Cloud Computing Infrastructure",
      "Mobile Application Development",
      "IT Project Management",
      "Digital Innovation Hub"
    ],
    vision: "To be a center of excellence in IT education and innovation",
    mission: "To develop IT professionals who can drive digital transformation and technological innovation"
  },
  {
    name: "Information Systems",
    description: "The Department of Information Systems bridges the gap between business and technology. Our programs focus on developing professionals who can design and implement information systems that drive business value and innovation.",
    programs: [
      "Bachelor of Information Systems",
      "Master of Information Systems"
    ],
    features: [
      "Business Analytics Center",
      "Enterprise Systems Lab",
      "Digital Business Solutions",
      "IT Governance Framework",
      "Business Intelligence Tools"
    ],
    vision: "To be a leading department in information systems education and business technology solutions",
    mission: "To prepare IS professionals who can align technology with business objectives and drive organizational success"
  }
];

const FacultyPage = (): ReactElement => {
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);

  const handleDepartmentClick = (departmentName: string): void => {
    setActiveDepartment(departmentName);
  };

  const handleDepartmentKeyDown = (e: KeyboardEvent<HTMLDivElement>, departmentName: string): void => {
    if (e.key === 'Enter') {
      setActiveDepartment(departmentName);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1119]">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] w-full bg-gradient-to-b from-emerald-900/20 via-emerald-900/10 to-[#0e1119]">
          <div className="relative z-20 h-full flex items-center justify-center text-white px-4">
            <div className="text-center max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">
                Faculty of Computing and Information Technology
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">King Abdulaziz University</p>
              <a 
                href="https://computing.kau.edu.sa/Default-611-ar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all duration-300"
                aria-label="Visit Faculty Official Website"
              >
                <Globe className="w-5 h-5" aria-hidden="true" />
                <span>Visit Official Website</span>
              </a>
            </div>
          </div>
        </section>

        {/* Overview Section */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">
              About Faculty
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8 text-gray-300">
                <div className="space-y-6">
                  <p className="leading-relaxed text-lg">
                    The Faculty of Computing and Information Technology (FCIT) at King Abdulaziz University in Jeddah is a leading academic institution dedicated to excellence in education, research, and innovation in the fields of computing and information technology. Established to meet the growing demand for IT professionals in Saudi Arabia and beyond, FCIT offers a range of undergraduate and postgraduate programs in Computer Science, Information Technology, and Information Systems.
                  </p>
                  <p className="leading-relaxed text-lg">
                    The faculty is committed to providing students with a comprehensive and up-to-date curriculum, hands-on learning experiences, and a stimulating research environment. It actively collaborates with industry and government sectors to ensure its graduates are well-prepared to contribute to the Kingdom&apos;s Vision 2030. Equipped with state-of-the-art laboratories, expert faculty members, and a focus on innovation and entrepreneurship, FCIT plays a vital role in shaping the future of technology in the region.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="flex items-center space-x-4 text-emerald-400 p-4 rounded-lg bg-gray-800/50 border border-emerald-500/20">
                    <Building2 className="w-6 h-6" aria-hidden="true" />
                    <span>Located in Building 71</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Departments Section */}
        <section className="py-20 bg-[#0e1119] border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">
              Departments
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {departments.map((dept) => (
                <div
                  key={dept.name}
                  className={`p-8 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105
                    ${activeDepartment === dept.name 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-gray-800 hover:border-emerald-500/50 bg-gray-800/50'}`}
                  onClick={() => handleDepartmentClick(dept.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleDepartmentKeyDown(e, dept.name)}
                  aria-label={`Select ${dept.name} department`}
                  aria-pressed={activeDepartment === dept.name}
                >
                  <h3 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">
                    {dept.name}
                  </h3>
                  <p className="text-gray-400 mb-6">{dept.description}</p>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-emerald-400 font-semibold mb-3">Vision & Mission</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-emerald-400 mb-1">Vision</p>
                          <p className="text-gray-500 text-sm">{dept.vision}</p>
                        </div>
                        <div>
                          <p className="text-sm text-emerald-400 mb-1">Mission</p>
                          <p className="text-gray-500 text-sm">{dept.mission}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-semibold mb-3">Programs</h4>
                      <ul className="space-y-2">
                        {dept.programs.map((program) => (
                          <li key={program} className="flex items-center text-gray-500">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3" aria-hidden="true" />
                            {program}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-semibold mb-3">Key Features</h4>
                      <ul className="space-y-2">
                        {dept.features.map((feature) => (
                          <li key={feature} className="flex items-center text-gray-500">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3" aria-hidden="true" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">
              Location & Contact
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start space-x-4 p-6 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                  <MapPin className="w-6 h-6 text-emerald-500 mt-1" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Address</h3>
                    <p className="text-gray-400">
                      King Abdulaziz University<br />
                      Jeddah, Saudi Arabia
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                  <Phone className="w-6 h-6 text-emerald-500 mt-1" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Phone</h3>
                    <p className="text-gray-400">+966 12 695 2000</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                  <Mail className="w-6 h-6 text-emerald-500 mt-1" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Email</h3>
                    <p className="text-gray-400">info@fcit.kau.edu.sa</p>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg shadow-emerald-500/10 bg-gray-800/50">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3712.577456331789!2d39.2470429!3d21.4966826!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15bdcf4341ab79e7%3A0x9f0d0b8c8c8c8c8c!2sKing%20Abdulaziz%20University!5e0!3m2!1sen!2ssa!4v1647681234567!5m2!1sen!2ssa&q=21.4966826,39.2470429&t=m&z=17&style=feature:all|element:all|invert_lightness:true|saturation:-100|lightness:0"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                  title="Faculty Location Map"
                />
                <a 
                  href="https://maps.app.goo.gl/3NXt1ZwrRrhETeUH6?g_st=com.google.maps.preview.copy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-all duration-300 flex items-center space-x-2"
                  aria-label="Open Faculty Location in Google Maps"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FacultyPage; 
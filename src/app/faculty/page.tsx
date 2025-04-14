'use client';

import { useState, KeyboardEvent, type ReactElement } from 'react';
import { MapPin, Building2, Phone, Mail, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import './faculty.css';
import QualityPolicy from '@/components/QualityPolicy/QualityPolicy';

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
    <div className="faculty-page">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="faculty-hero">
          <div className="faculty-hero-content">
            <div className="text-center max-w-4xl">
              <h1 className="faculty-title">
                Faculty of Computing and Information Technology
              </h1>
              <p className="faculty-subtitle">King Abdulaziz University</p>
              <a 
                href="https://computing.kau.edu.sa/Default-611-ar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="website-link"
                aria-label="Visit Faculty Official Website"
              >
                <Globe className="w-5 h-5" aria-hidden="true" />
                <span>Visit Official Website</span>
              </a>
            </div>
          </div>
        </section>

        {/* Overview Section */}
        <section className="section-container">
          <div className="max-w-6xl mx-auto">
            <h2 className="section-title">
              About Faculty
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                <div className="space-y-6">
                  <p className="about-text">
                    The Faculty of Computing and Information Technology (FCIT) at King Abdulaziz University in Jeddah is a leading academic institution dedicated to excellence in education, research, and innovation in the fields of computing and information technology. Established to meet the growing demand for IT professionals in Saudi Arabia and beyond, FCIT offers a range of undergraduate and postgraduate programs in Computer Science, Information Technology, and Information Systems.
                  </p>
                  <p className="about-text">
                    The faculty is committed to providing students with a comprehensive and up-to-date curriculum, hands-on learning experiences, and a stimulating research environment. It actively collaborates with industry and government sectors to ensure its graduates are well-prepared to contribute to the Kingdom&apos;s Vision 2030. Equipped with state-of-the-art laboratories, expert faculty members, and a focus on innovation and entrepreneurship, FCIT plays a vital role in shaping the future of technology in the region.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="building-info">
                    <Building2 className="w-6 h-6" aria-hidden="true" />
                    <span>Located in Building 71</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quality Policy Section */}
        <section className="quality-section">
          <QualityPolicy />
        </section>

        {/* Departments Section */}
        <section className="section-container section-border">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <h2 className="section-title">
              Departments
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {departments.map((dept) => (
                <div
                  key={dept.name}
                  className={`department-card ${activeDepartment === dept.name ? 'active' : ''}`}
                  onClick={() => handleDepartmentClick(dept.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleDepartmentKeyDown(e, dept.name)}
                  aria-label={`Select ${dept.name} department`}
                  aria-pressed={activeDepartment === dept.name}
                >
                  <h3 className="department-title">
                    {dept.name}
                  </h3>
                  <p className="department-description">{dept.description}</p>
                  <div className="space-y-6">
                    <div>
                      <h4 className="section-heading">Vision & Mission</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm section-heading mb-1">Vision</p>
                          <p className="text-sm department-description">{dept.vision}</p>
                        </div>
                        <div>
                          <p className="text-sm section-heading mb-1">Mission</p>
                          <p className="text-sm department-description">{dept.mission}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="section-heading">Programs</h4>
                      <ul className="space-y-2">
                        {dept.programs.map((program) => (
                          <li key={program} className="list-item">
                            <span className="list-marker" aria-hidden="true" />
                            {program}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="section-heading">Key Features</h4>
                      <ul className="space-y-2">
                        {dept.features.map((feature) => (
                          <li key={feature} className="list-item">
                            <span className="list-marker" aria-hidden="true" />
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
        <section className="section-container">
          <div className="max-w-6xl mx-auto">
            <h2 className="section-title">
              Location & Contact
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="contact-card">
                  <MapPin className="contact-icon" aria-hidden="true" />
                  <div>
                    <h3 className="contact-title">Address</h3>
                    <p className="contact-text">
                      King Abdulaziz University<br />
                      Jeddah, Saudi Arabia
                    </p>
                  </div>
                </div>
                <div className="contact-card">
                  <Phone className="contact-icon" aria-hidden="true" />
                  <div>
                    <h3 className="contact-title">Phone</h3>
                    <p className="contact-text">+966 12 695 2000</p>
                  </div>
                </div>
                <div className="contact-card">
                  <Mail className="contact-icon" aria-hidden="true" />
                  <div>
                    <h3 className="contact-title">Email</h3>
                    <p className="contact-text">info@fcit.kau.edu.sa</p>
                  </div>
                </div>
              </div>
              <div className="map-container">
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
                  className="map-link"
                  aria-label="Open Faculty Location in Google Maps"
                >
                  <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
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
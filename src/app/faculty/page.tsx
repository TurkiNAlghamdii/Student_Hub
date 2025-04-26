/**
 * Faculty Page Component
 * 
 * This client-side component provides comprehensive information about the Faculty of Computing
 * and Information Technology at King Abdulaziz University, including:
 * - Faculty overview and mission
 * - Academic departments with their programs and features
 * - Vision and mission statements for each department
 * - Contact information and location
 * 
 * The component implements interactive department cards that users can click to view details,
 * and includes accessibility features for keyboard navigation.
 * 
 * The component respects the application's theme system by using CSS classes
 * that work with both light and dark modes via the root element class.
 * All styling is defined in faculty.css which uses :root.dark and :root:not(.dark)
 * selectors to ensure proper theming without any flash of incorrect theme.
 */

'use client';

import { useState, KeyboardEvent, type ReactElement } from 'react';
import { MapPin, Building2, Phone, Mail, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import './faculty.css';
import QualityPolicy from '@/components/QualityPolicy/QualityPolicy';

/**
 * Department Interface
 * 
 * Defines the structure of department data displayed on the faculty page.
 * 
 * @property name - Name of the academic department
 * @property description - Detailed description of the department's focus and objectives
 * @property programs - Array of academic programs offered by the department
 * @property features - Array of key features or facilities available in the department
 * @property vision - The department's vision statement
 * @property mission - The department's mission statement
 */
interface Department {
  name: string;
  description: string;
  programs: string[];
  features: string[];
  vision: string;
  mission: string;
}

/**
 * Department Data
 * 
 * Static array of department information for the Faculty of Computing and Information Technology.
 * Each department includes its name, description, programs offered, key features, vision, and mission.
 * This data is used to generate the interactive department cards in the UI.
 */
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

/**
 * FacultyPage Component
 * 
 * Main component for displaying information about the Faculty of Computing and Information Technology.
 * Includes sections for faculty overview, departments, quality policy, and contact information.
 * 
 * @returns Rendered faculty page with interactive department cards and contact information
 */
const FacultyPage = (): ReactElement => {
  /**
   * Component State
   * 
   * - activeDepartment: Tracks which department card is currently selected/active
   *   This is used to apply visual highlighting to the selected department card
   */
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);

  /**
   * Department Selection Handler (Mouse Click)
   * 
   * Updates the active department state when a user clicks on a department card.
   * 
   * @param departmentName - Name of the department that was clicked
   */
  const handleDepartmentClick = (departmentName: string): void => {
    setActiveDepartment(departmentName);
  };

  /**
   * Department Selection Handler (Keyboard)
   * 
   * Provides keyboard accessibility for department selection.
   * Activates a department when the Enter key is pressed while focused on a department card.
   * 
   * @param e - Keyboard event object
   * @param departmentName - Name of the department that is focused
   */
  const handleDepartmentKeyDown = (e: KeyboardEvent<HTMLDivElement>, departmentName: string): void => {
    if (e.key === 'Enter') {
      setActiveDepartment(departmentName);
    }
  };

  /**
   * Main Component Render
   * 
   * Renders the complete faculty page with multiple sections:
   * - Hero section with faculty title and link to official website
   * - About section with faculty description
   * - Quality policy section
   * - Departments section with interactive department cards
   * - Location and contact information section with embedded map
   * 
   * The UI is designed to be responsive and uses theme-compatible styling
   * that works in both light and dark modes through CSS classes defined in faculty.css.
   * The styling uses :root.dark and :root:not(.dark) selectors to ensure proper theming
   * without any flash of incorrect theme during page load or navigation.
   */
  return (
    <div className="faculty-page">
      <Navbar />
      <main>
        {/* Hero Section - Displays the faculty title and official website link */}
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

        {/* Overview Section - Provides detailed information about the faculty */}
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

        {/* Quality Policy Section - Displays the faculty's quality policy using the QualityPolicy component */}
        <section className="quality-section">
          <QualityPolicy />
        </section>

        {/* Departments Section - Displays interactive cards for each academic department */}
        <section className="section-container section-border">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <h2 className="section-title">
              Departments
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Map through the departments array to create a card for each department */}
              {departments.map((dept) => (
                /* Department card with interactive functionality and accessibility attributes */
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

        {/* Location Section - Displays contact information and an interactive map */}
        <section className="section-container">
          <div className="max-w-6xl mx-auto">
            <h2 className="section-title">
              Location & Contact
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact information cards with icons */}
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
              {/* Interactive Google Maps embed with link to open in Google Maps */}
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

/**
 * Export the FacultyPage component as the default export
 * This component is used in the faculty route of the application
 */
export default FacultyPage; 
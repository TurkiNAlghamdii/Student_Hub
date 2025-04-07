'use client';

import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { HeartIcon, XMarkIcon, QuestionMarkCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import './Footer.css';

interface SupportFormData {
  email: string;
  issue: string;
  description: string;
}

interface FormErrors {
  email?: string;
  issue?: string;
  description?: string;
  general?: string;
}

// Separate the Contact Modal into its own component
const ContactModal = memo(function ContactModal({
  closeContactModal,
  submitMessage,
  submitStatus,
  formData,
  formErrors,
  handleInputChange,
  handleSubmit,
  isSubmitting
}: {
  closeContactModal: () => void;
  submitMessage: string | null;
  submitStatus: 'success' | 'error' | null;
  formData: SupportFormData;
  formErrors: FormErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}) {
  return (
    <div 
      className="contact-modal-backdrop" 
      onClick={closeContactModal}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="contact-modal" 
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="contact-modal-header">
          <div className="modal-title">
            <QuestionMarkCircleIcon className="w-5 h-5 text-emerald-400" />
            <h3>Contact Support</h3>
          </div>
          <button 
            className="close-button"
            onClick={closeContactModal}
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="contact-modal-content">
          {submitMessage ? (
            <div className={`submit-message ${submitStatus}`}>
              {submitStatus === 'success' && (
                <div className="success-icon-container">
                  <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
              <p>{submitMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <p className="form-description">
                We&apos;re here to help! Fill out the form below and we&apos;ll get back to you as soon as possible.
              </p>
              
              {formErrors.general && (
                <div className="form-error general-error">
                  {formErrors.general}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="you@example.com"
                  className={formErrors.email ? 'input-error' : ''}
                />
                {formErrors.email && <div className="field-error-message">{formErrors.email}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="issue">Issue Type</label>
                <select
                  id="issue"
                  name="issue"
                  value={formData.issue}
                  onChange={handleInputChange}
                  required
                  className={formErrors.issue ? 'input-error' : ''}
                >
                  <option value="">Please select...</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account Issue</option>
                  <option value="other">Other Question</option>
                </select>
                {formErrors.issue && <div className="field-error-message">{formErrors.issue}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Please describe your issue in detail..."
                  rows={4}
                  className={formErrors.description ? 'input-error' : ''}
                />
                {formErrors.description && <div className="field-error-message">{formErrors.description}</div>}
              </div>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
});

export default function Footer() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [formData, setFormData] = useState<SupportFormData>({
    email: '',
    issue: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isContactOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isContactOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear the specific field error when user makes changes
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email address is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Issue type validation
    if (!formData.issue) {
      errors.issue = 'Please select an issue type';
      isValid = false;
    }
    
    // Description validation
    if (!formData.description) {
      errors.description = 'Please provide a description';
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors and messages
    setFormErrors({});
    setSubmitMessage(null);
    
    // Validate the form first
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the API endpoint
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle different types of API errors
        if (data.validation && Object.keys(data.validation).length > 0) {
          // Server returned specific validation errors
          setFormErrors(data.validation);
          throw new Error('Please correct the highlighted fields');
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error('Failed to submit support request. Please try again later.');
        }
      }
      
      // Success scenario
      setSubmitStatus('success');
      setSubmitMessage('Thank you for your feedback! We will get back to you soon.');
      setFormData({ email: '', issue: '', description: '' });
      
      // Close form after delay
      setTimeout(() => {
        setIsContactOpen(false);
        setSubmitMessage(null);
        setSubmitStatus(null);
      }, 3000);
      
    } catch (error) {
      // Error scenario
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openContactModal = () => {
    setIsContactOpen(true);
  };

  const closeContactModal = () => {
    setIsContactOpen(false);
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-credits">
            Made with <HeartIcon className="heart-icon" /> by{' '}
            <span className="author-name">Turki</span>,{' '}
            <span className="author-name">Khalid</span>,{' '}
            <span className="author-name">Husam</span>
          </div>
          
          <div className="footer-actions">
            <a 
              href="https://discord.gg/rn8jzRH6"
              target="_blank"
              rel="noopener noreferrer"
              className="discord-button"
              aria-label="Join our Discord server"
            >
              <svg className="discord-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"/>
              </svg>
              Join Discord
            </a>
            
            <button 
              className="contact-button"
              onClick={openContactModal}
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
              Contact Support
            </button>
          </div>
        </div>
      </footer>

      {/* Render modal using portal */}
      {mounted && isContactOpen && createPortal(
        <ContactModal
          closeContactModal={closeContactModal}
          submitMessage={submitMessage}
          submitStatus={submitStatus}
          formData={formData}
          formErrors={formErrors}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />,
        document.getElementById('modal-root') || document.body
      )}
    </>
  );
} 
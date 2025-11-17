import React, { useState, useEffect } from 'react';
import styles from './RightSection.module.css';

const RightSection = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
        credentials: 'include',
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/newsletter/templates/`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('🚫 Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(getDefaultMessage(templateId));
    }
  };

  const getDefaultMessage = (templateId) => {
    const defaultMessages = {
      welcome: `🎉 Welcome to RushHour Camp! 

We're absolutely thrilled to have you join our amazing community of adventure seekers! 

🌟 What you can expect:
• Exclusive adventure tips
• Early access to new courses
• Special member-only offers
• Community events and meetups

Get ready for an unforgettable journey! 🚀

Best regards,
The RushHour Camp Team 🏕️`,

      newsletter: `📰 Monthly Newsletter - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

Hello Adventurers! 👋

Here's what's new this month:

🎯 New Activities Launched
We've added 3 exciting new adventure courses! Check them out on our website.

🏆 Success Stories
Read how Sarah completed our advanced climbing course - her story will inspire you!

📅 Upcoming Events
Mark your calendars for our annual Adventure Fest on the 25th!

Stay adventurous! 🌄

The RushHour Camp Team`,

      promotion: `🔥 SPECIAL PROMOTION - LIMITED TIME OFFER!

Hello valued member! 

We're excited to offer you an exclusive discount that you won't find anywhere else:

💎 30% OFF ALL PREMIUM COURSES
Use code: RUSHCAMP24

This offer includes:
• Rock Climbing Masterclass 🧗‍♂️
• Survival Skills Workshop 🏕️
• Advanced Navigation Course 🧭

⏰ Offer ends: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Don't miss out on this amazing opportunity! 🎁`,

      announcement: `📢 IMPORTANT ANNOUNCEMENT

Dear RushHour Camp Community,

We have an important update that requires your attention:

🚨 System Maintenance
We'll be performing essential maintenance on our booking system this weekend. The system will be unavailable from Saturday 10 PM to Sunday 2 AM.

✅ What you need to know:
• All existing bookings are safe
• You can still visit our physical location
• Emergency contact number remains active

We apologize for any inconvenience and appreciate your understanding. 🙏

Thank you for being part of our adventure family! ❤️`
    };
    return defaultMessages[templateId] || '';
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate || !subject || !message) {
      setStatus('❌ Please fill in all required fields');
      return;
    }

    if (recipientType === 'single' && !recipientEmail) {
      setStatus('❌ Please enter recipient email');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
        credentials: 'include',
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/newsletter/send/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
          template_id: selectedTemplate,
          subject: subject,
          message: message,
          recipient_type: recipientType,
          recipient_email: recipientEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(`✅ ${data.message}`);
        setSelectedTemplate('');
        setSubject('');
        setMessage('');
        setRecipientEmail('');
      } else {
        setStatus(`❌ ${data.message}`);
      }
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const getTemplateIcon = (templateId) => {
    const icons = {
      welcome: '🎉',
      newsletter: '📰',
      promotion: '🔥',
      announcement: '📢'
    };
    return icons[templateId] || '📧';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🚀 Send Newsletter</h2>
        <p>Create and send beautiful email campaigns</p>
      </div>

      <div className={styles.templateSection}>
        <h3>🎨 Choose Template</h3>
        <div className={styles.templateGrid}>
          {templates.map(template => (
            <div
              key={template.id}
              className={`${styles.templateCard} ${
                selectedTemplate === template.id ? styles.selected : ''
              }`}
              onClick={() => handleTemplateChange(template.id)}
            >
              <div className={styles.templateIcon}>
                {getTemplateIcon(template.id)}
              </div>
              <div className={styles.templateInfo}>
                <h4>{template.name}</h4>
                <p>{template.description}</p>
              </div>
              <div className={styles.radioIndicator}>
                {selectedTemplate === template.id ? '🔘' : '⚪'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label htmlFor="subject" className={styles.label}>
            📝 Subject Line
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={styles.input}
            placeholder="Enter an engaging subject line..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="message" className={styles.label}>
            💌 Message Content
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={styles.textarea}
            placeholder="Write your email content here... Use emojis to make it engaging! 🎯"
            rows="10"
          />
          <div className={styles.charCount}>
            📊 {message.length} characters
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>🎯 Recipients</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="all"
                checked={recipientType === 'all'}
                onChange={(e) => setRecipientType(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <span className={styles.radioText}>
                👥 All Subscribers
              </span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="single"
                checked={recipientType === 'single'}
                onChange={(e) => setRecipientType(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <span className={styles.radioText}>
                👤 Single Recipient
              </span>
            </label>
          </div>
          
          {recipientType === 'single' && (
            <div className={styles.singleRecipient}>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter recipient email address..."
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionSection}>
        <button
          onClick={handleSendEmail}
          disabled={loading || !selectedTemplate}
          className={styles.sendButton}
        >
          <span className={styles.buttonIcon}>
            {loading ? '⏳' : '📤'}
          </span>
          {loading ? 'Sending...' : 'Send Email Campaign'}
        </button>

        {status && (
          <div className={`${styles.status} ${
            status.includes('✅') ? styles.success : 
            status.includes('❌') ? styles.error : styles.info
          }`}>
            {status}
          </div>
        )}
      </div>

      <div className={styles.tips}>
        <h4>💡 Pro Tips:</h4>
        <ul>
          <li>Use emojis to make your emails more engaging 🎯</li>
          <li>Keep subject lines under 50 characters</li>
          <li>Test with single recipient before sending to all</li>
          <li>Personalize messages for better engagement</li>
        </ul>
      </div>
    </div>
  );
};

export default RightSection;
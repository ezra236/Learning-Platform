import React from 'react';
import styles from './ContactPage.module.css';

const ContactChannels = () => {
  const channels = [
    {
      id: 1,
      name: 'WhatsApp',
      icon: '💬',
      description: 'Instant support & quick questions',
      link: 'https://wa.me/your-number',
      color: '#25D366',
      status: '🟢 Online now'
    },
    {
      id: 2,
      name: 'Instagram',
      icon: '📷',
      description: 'Study tips & daily motivation',
      link: 'https://instagram.com/rushhourcamp',
      color: '#E4405F',
      status: '📱 Daily updates'
    },
    {
      id: 3,
      name: 'Facebook',
      icon: '👥',
      description: 'Community & group discussions',
      link: 'https://facebook.com/rushhourcamp',
      color: '#1877F2',
      status: '🌟 Active community'
    },
    {
      id: 4,
      name: 'TikTok',
      icon: '🎵',
      description: 'Quick study hacks & mnemonics',
      link: 'https://tiktok.com/@rushhourcamp',
      color: '#000000',
      status: '⚡ Bite-sized content'
    }
  ];

  return (
    <section className={styles.contactChannels}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Connect With Us</h2>
        <p className={styles.sectionSubtitle}>
          Choose your preferred way to reach out. We're here to help 24/7! 🕒
        </p>
      </div>
      <div className={styles.channelsGrid}>
        {channels.map((channel, index) => (
          <a
            key={channel.id}
            href={channel.link}
            className={styles.channelCard}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              '--channel-color': channel.color,
              '--animation-delay': `${index * 0.1}s`
            }}
          >
            <div className={styles.channelHeader}>
              <div className={styles.channelIcon}>{channel.icon}</div>
              <span className={styles.channelStatus}>{channel.status}</span>
            </div>
            <h3 className={styles.channelName}>{channel.name}</h3>
            <p className={styles.channelDescription}>{channel.description}</p>
            <div className={styles.channelHover}></div>
            <div className={styles.channelSparkle}></div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default ContactChannels;
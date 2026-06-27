import { useState } from 'react';

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 4 10 8 6 12" />
  </svg>
);

const AGREEMENTS = [
  {
    key: 'impeccableWord',
    label: 'Be impeccable with your word',
    description:
      'Speak with integrity. Say only what you mean. Use your words in the direction of truth and love. Avoid speaking against yourself or gossiping about others.',
  },
  {
    key: 'nothingPersonal',
    label: "Don't take anything personally",
    description:
      "What others say and do is a reflection of their own reality, not yours. When you are immune to the opinions of others, you free yourself from needless suffering.",
  },
  {
    key: 'noAssumptions',
    label: "Don't make assumptions",
    description:
      'Find the courage to ask questions and express what you really want. Communicate clearly with others to avoid misunderstandings, sadness, and drama.',
  },
  {
    key: 'doYourBest',
    label: 'Always do your best',
    description:
      'Your best will change from moment to moment depending on your circumstances. Simply do your best in each situation and you will avoid self-judgment and regret.',
  },
];

function FourAgreements({ collapsed }) {
  const [expandedKey, setExpandedKey] = useState(null);

  const toggleExpand = (key) => {
    if (collapsed) return;
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    <section className="section">
      <h2 className="section-header">The Four Agreements</h2>

      <ul className="agreements-list">
        {AGREEMENTS.map((agreement) => {
          const isExpanded = !collapsed && expandedKey === agreement.key;
          return (
            <li
              key={agreement.key}
              className={`agreement-item${collapsed ? ' agreement-item--collapsed' : ''}`}
              onClick={() => toggleExpand(agreement.key)}
              role={collapsed ? undefined : 'button'}
              tabIndex={collapsed ? undefined : 0}
            >
              <div className="agreement-row">
                <span className="agreement-label">{agreement.label}</span>
                {!collapsed && (
                  <span className={`agreement-chevron${isExpanded ? ' agreement-chevron--expanded' : ''}`}>
                    <ChevronIcon />
                  </span>
                )}
              </div>
              {!collapsed && (
                <div className={`agreement-description${isExpanded ? ' agreement-description--expanded' : ''}`}>
                  <p className="agreement-description-text">{agreement.description}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default FourAgreements;

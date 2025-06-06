'use client';
import { AlignJustify, MoonStar, Sun, ChevronRight, ChevronDown, ChevronsDownUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const TreeNode = ({ item, level = 0, onTopicSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const hoverTimeout = useRef(null);
  const cooldownTimeout = useRef(null);
  const hasChildren = item.children && item.children.length > 0;
  const isClickable = item.link !== null;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hasChildren && !isExpanded && !isInCooldown) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => {
        setIsExpanded(true);
      }, 600);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hasChildren) {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    }
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    if (hasChildren && isExpanded) {
      setIsExpanded(false);
      setIsInCooldown(true);
      cooldownTimeout.current = setTimeout(() => {
        setIsInCooldown(false);
      }, 1000);
    }
  };

  const handleTopicClick = () => {
    if (isClickable) {
      const prompt = `
      Read this wiki page: ${item.link}. Write a piece of understandable and comprehensive education content. The main content should include:
      1) ${item.name}, which is the topic name
      2) Topic Introduction. Around 20 words
      3) The most fundamental and essential knowledge, ranking by importance levels with supporting data:
      - Essential for Everyone
      - Important for Understanding
      - Useful for Deeper Knowledge
      - For Enthusiasts
      4) End with exactly: "For more in-depth information, refer to [${item.name}](${item.link}), or ask me further questions!"
      Format your responses using proper markdown syntax. Follow these formatting guidelines:
      1) Structure:
      - Use # for "Topic name", ## for "Topic Introduction" and ### for four knowledge levels
      - Use - for bullet points
      - Use 1. 2. 3. for numbered lists only for processes or rankings
      - Leave exactly one blank line after each heading before content begins
      - Leave exactly one blank line between each major section
      2) Consistency Rules:
      - Start responses directly without unnecessary greetings`;
      onTopicSelect(item.name, prompt);
    }
  };

  return (
    <div 
      className="tree-node"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={`tree-item level-${level} ${isHovered ? 'hovered' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren && (
          <span className="tree-toggle">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        {!hasChildren && <span className="tree-spacer" />}
        <span 
          className={`tree-label ${isClickable ? 'clickable' : ''}`}
          onClick={isClickable ? handleTopicClick : undefined}
        >
          {item.name}
        </span>
        {isExpanded && hasChildren && (
          <span 
            className="clickable-indicator"
            onClick={handleIconClick}
          >
            <ChevronsDownUp size={16} />
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="tree-children">
          {item.children.map((child, index) => (
            <TreeNode
              key={`${child.name}-${index}`}
              item={child}
              level={level + 1}
              onTopicSelect={onTopicSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  theme, 
  setTheme,
  onTopicSelect 
}) => {
  const [scrapedData, setScrapedData] = useState([]);

  useEffect(() => {
    fetch('/data/tree_data.json')
      .then(response => response.json())
      .then(data => setScrapedData(data))
      .catch(error => console.error('Error loading tree data:', error));
  }, []);

  return (
    <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={() => setIsSidebarOpen((prev) => !prev)}>
          <AlignJustify size={20} />
        </button>
        <button className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? <MoonStar size={24} /> : <Sun size={24} />}
        </button>
      </div>

      <div className="sidebar-content">
        <div className="tree-container">
          <div className="tree-root">
            {scrapedData.map((section, index) => (
                <TreeNode
                  key={`${section.name}-${index}`}
                  item={section}
                  level={0}
                  onTopicSelect={onTopicSelect}
                />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
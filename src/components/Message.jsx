'use client';
import Markdown from 'markdown-to-jsx';

const Message = ({ message, theme }) => {
  const avatarSrc = theme === "dark" ? "/bot_dark.png" : "/bot_light.png";

  return (
    <div id={message.id} className={`message ${message.role}-message ${message.loading ? "loading" : ""} ${message.error ? "error" : ""}`}>
      {message.role === "bot" && <img className="avatar" src={avatarSrc} alt="Avatar" />}
      <Markdown
        className="text" 
        options={{ 
          overrides: {
            a: {props: {target: '_blank', rel: 'noopener noreferrer'}}
          }
        }}
      >
        {message.content}
      </Markdown>
    </div>
  );
};

export default Message;
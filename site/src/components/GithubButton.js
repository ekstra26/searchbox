import React from 'react';
import Button from './Button';

class GithubButton extends React.Component {
  state = {
    githubStarCount: 0
  };

  componentDidMount() {
    fetch('https://api.github.com/repos/appbaseio/searchbox')
      .then(res => res.json())
      .then(res => {
        this.setState({
          githubStarCount: res.stargazers_count || 9
        });
      })
      .catch(e => console.log(e));
  }

  render() {
    const { githubStarCount } = this.state;
    const { className } = this.props;
    return (
      <Button
        inverse
        className={`relative ${className || ''}`}
        href="https://github.com/appbaseio"
      >
        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
        <span className="mr-10">Github</span>
        <div className="absolute right-0 top-0 h-full flex px-3 py-3 items-center align-center rounded-md font-medium bg-opacity-50 bg-pink-100 rounded-tl-none rounded-bl-none lg:px-4 md:py-0">
          {githubStarCount}
        </div>
      </Button>
    );
  }
}

export default GithubButton;
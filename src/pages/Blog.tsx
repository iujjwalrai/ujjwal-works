import { Link } from 'react-router-dom';
import { getBlogPosts, formatPostDate } from '../data/blog';

export default function Blog() {
  const posts = getBlogPosts();

  return (
    <div className="page">
      <div className="wrap wrap--narrow">
        <header className="page__head">
          <p className="sec__kicker">
            <span className="sec__index">~/blog</span>
            <span className="sec__rule" />
            Writing
          </p>
          <h1 className="page__title">Thoughts, <em>compiled</em></h1>
          <p className="page__lede">Notes on things I've built, broken, and fixed — mostly backend, occasionally philosophical.</p>
        </header>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">✍️</div>
            <p className="empty-state__text">404: thoughts not found (yet).</p>
          </div>
        ) : (
          <div className="blog-list">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.id}`} className="blog-item">
                <span className="blog-item__date">{formatPostDate(post.date)}</span>
                <div className="blog-item__main">
                  <h2 className="blog-item__title">
                    {post.draft && <span className="tag">draft</span>}
                    {post.title}
                  </h2>
                  <p className="blog-item__excerpt">{post.excerpt}</p>
                </div>
                <svg className="blog-item__arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

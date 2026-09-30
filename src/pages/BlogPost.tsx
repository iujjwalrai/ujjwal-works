import { useParams, Link } from 'react-router-dom';
import { getBlogPost, formatPostDate } from '../data/blog';
import { renderMarkdown } from '../lib/markdown';

const BackLink = () => (
  <Link to="/blog" className="blog-post__back">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
    Back to blog
  </Link>
);

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const post = id ? getBlogPost(id) : undefined;

  if (!post) {
    return (
      <div className="blog-post">
        <div className="wrap wrap--narrow">
          <BackLink />
          <h1 className="blog-post__title">404 — post not found</h1>
          <p className="page__lede">This one never made it past <code>git commit</code>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post">
      <div className="wrap wrap--narrow">
        <BackLink />

        <h1 className="blog-post__title">{post.title}</h1>
        <div className="blog-post__meta">
          <span>{formatPostDate(post.date, 'long')}</span>
          {post.tags.length > 0 && (
            <div className="blog-post__tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="blog-post__body">
          {renderMarkdown(post.body)}
        </div>
      </div>
    </div>
  );
}

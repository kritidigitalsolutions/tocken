import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import blogImg from '../assets/images/blog-img.png'
import blogThumb1 from '../assets/images/blog-thumb-1.png'
import './BlogSection.css'

const blogs = [
  {
    id: 1,
    title: '10 Must-Have Smart Home Devices for Every Homeowner',
    date: 'May 15, 2023',
    readTime: '5 min read',
    thumbnail: blogThumb1,
  },
  {
    id: 2,
    title: '10 Must-Have Smart Home Devices for Every Homeowner',
    date: 'May 15, 2023',
    readTime: '5 min read',
    thumbnail: null,
  },
  {
    id: 3,
    title: '10 Must-Have Smart Home Devices for Every Homeowner',
    date: 'May 15, 2023',
    readTime: '5 min read',
    thumbnail: null,
  },
]

export default function BlogSection() {
  return (
    <section className="blog-section section" id="blog">
      <div className="container">
        <div className="blog-section__layout">

          {/* ── Left column: heading + featured image ── */}
          <motion.div
            className="blog-section__left"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="blog-section__header">
              <span className="blog-section__label">OUR BLOG</span>
              <h2 className="blog-section__title">Read Our<br />Latest Insight</h2>
              <a href="#" className="blog-section__see-all">
                See All <ArrowRight size={16} />
              </a>
            </div>

            <div className="blog-section__featured">
              <img src={blogImg} alt="Featured Blog" className="blog-section__featured-img" />
            </div>
          </motion.div>

          {/* ── Right column: blog list ── */}
          <div className="blog-section__list">
            {blogs.map((blog, index) => (
              <motion.article
                key={blog.id}
                className="blog-card"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <div className="blog-card__content">
                  <div className="blog-card__meta">
                    <span className="blog-card__date">{blog.date}</span>
                    <span className="blog-card__dot">•</span>
                    <span className="blog-card__read-time">{blog.readTime}</span>
                  </div>
                  <h3 className="blog-card__title">{blog.title}</h3>
                  <a href="#" className="blog-card__link">
                    Continue reading <ArrowRight size={14} />
                  </a>
                </div>
                <div className="blog-card__thumb">
                  {blog.thumbnail ? (
                    <img src={blog.thumbnail} alt={blog.title} />
                  ) : (
                    <div className="blog-card__thumb-placeholder" />
                  )}
                </div>
              </motion.article>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

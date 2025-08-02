import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Clock, 
  User, 
  Shield, 
  Zap, 
  Settings, 
  BookOpen,
  TrendingUp,
  Award,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  author: string;
  date: string;
  tags: string[];
  featured: boolean;
}

export const LearnMore: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    {
      id: "1",
      title: "Complete Guide to PDF Conversion: From Beginner to Expert",
      excerpt: "Master the art of PDF conversion with our comprehensive guide covering all major file formats, best practices, and professional tips.",
      content: `
        <h2>Introduction to PDF Conversion</h2>
        <p>PDF (Portable Document Format) has become the universal standard for document sharing and archiving. Whether you're a business professional, student, or casual user, understanding PDF conversion is essential in today's digital world.</p>
        
        <h3>Why PDF Conversion Matters</h3>
        <ul>
          <li><strong>Universal Compatibility:</strong> PDFs display consistently across all devices and platforms</li>
          <li><strong>Document Security:</strong> Advanced security features protect sensitive information</li>
          <li><strong>Professional Presentation:</strong> Maintains formatting and layout integrity</li>
          <li><strong>Archival Quality:</strong> Long-term document preservation</li>
        </ul>

        <h3>Common Conversion Scenarios</h3>
        <p><strong>Word to PDF:</strong> Perfect for reports, proposals, and official documents that need to maintain formatting.</p>
        <p><strong>Excel to PDF:</strong> Ideal for sharing spreadsheets while preserving calculations and charts without allowing edits.</p>
        <p><strong>PowerPoint to PDF:</strong> Convert presentations for easy sharing and viewing without PowerPoint software.</p>
        <p><strong>Image to PDF:</strong> Combine multiple images into a single document for portfolios or documentation.</p>

        <h3>Best Practices for PDF Conversion</h3>
        <ol>
          <li><strong>Choose the Right Quality:</strong> Balance file size with image quality based on your needs</li>
          <li><strong>Optimize for Purpose:</strong> Web viewing requires different settings than printing</li>
          <li><strong>Consider Security:</strong> Add password protection for sensitive documents</li>
          <li><strong>Maintain Accessibility:</strong> Ensure converted PDFs are readable by screen readers</li>
          <li><strong>Test Before Sharing:</strong> Always review converted files before distribution</li>
        </ol>

        <h3>Advanced Conversion Tips</h3>
        <p><strong>Batch Conversion:</strong> Save time by converting multiple files simultaneously using professional tools.</p>
        <p><strong>OCR Technology:</strong> Convert scanned documents into searchable, editable PDFs.</p>
        <p><strong>Compression Techniques:</strong> Reduce file sizes while maintaining quality for email and web sharing.</p>

        <h3>Common Conversion Challenges and Solutions</h3>
        <p><strong>Font Issues:</strong> Embed fonts during conversion to prevent display problems on different devices.</p>
        <p><strong>Image Quality:</strong> Use appropriate DPI settings - 300 DPI for print, 150 DPI for screen viewing.</p>
        <p><strong>Large File Sizes:</strong> Implement compression strategies and optimize images before conversion.</p>

        <h3>Conclusion</h3>
        <p>Mastering PDF conversion opens up new possibilities for document management and sharing. With the right tools and knowledge, you can ensure your documents maintain their professional appearance while being accessible to your intended audience.</p>
      `,
      category: "Conversion",
      readTime: "8 min",
      author: "PDF Convert Master Team",
      date: "December 15, 2024",
      tags: ["PDF", "Conversion", "Best Practices", "Tutorial"],
      featured: true
    },
    {
      id: "2",
      title: "PDF Security: Protecting Your Documents in the Digital Age",
      excerpt: "Learn essential PDF security features including password protection, encryption, and digital signatures to keep your documents safe.",
      content: `
        <h2>Understanding PDF Security</h2>
        <p>In an era where data breaches and document theft are increasingly common, securing your PDF documents is not just important—it's essential. PDF security features provide multiple layers of protection for your sensitive information.</p>

        <h3>Types of PDF Security</h3>
        <p><strong>Password Protection:</strong> The first line of defense against unauthorized access.</p>
        <ul>
          <li>User passwords restrict opening the document</li>
          <li>Owner passwords control editing and printing permissions</li>
          <li>Use strong, unique passwords with a combination of letters, numbers, and symbols</li>
        </ul>

        <p><strong>Encryption:</strong> Advanced mathematical protection for sensitive data.</p>
        <ul>
          <li>128-bit encryption for standard protection</li>
          <li>256-bit AES encryption for maximum security</li>
          <li>Protects data both at rest and in transit</li>
        </ul>

        <h3>Permission Controls</h3>
        <p>Set specific restrictions on what users can do with your PDF:</p>
        <ul>
          <li><strong>Printing:</strong> Allow, restrict, or completely disable printing</li>
          <li><strong>Editing:</strong> Prevent text changes while allowing form filling</li>
          <li><strong>Copying:</strong> Control text and image extraction</li>
          <li><strong>Commenting:</strong> Enable or disable annotation features</li>
        </ul>

        <h3>Digital Signatures</h3>
        <p>Ensure document authenticity and integrity with digital signatures:</p>
        <ul>
          <li>Verify the identity of the document author</li>
          <li>Detect any unauthorized changes</li>
          <li>Provide legal validity for electronic documents</li>
          <li>Enable secure collaboration and approval workflows</li>
        </ul>

        <h3>Best Practices for PDF Security</h3>
        <ol>
          <li><strong>Classify Your Documents:</strong> Determine the appropriate security level based on content sensitivity</li>
          <li><strong>Use Strong Passwords:</strong> Implement complex passwords that are difficult to guess or crack</li>
          <li><strong>Regular Updates:</strong> Keep your PDF software updated with the latest security patches</li>
          <li><strong>Secure Distribution:</strong> Use encrypted channels when sharing sensitive PDFs</li>
          <li><strong>Access Monitoring:</strong> Track who accesses your documents and when</li>
        </ol>

        <h3>Industry-Specific Security Considerations</h3>
        <p><strong>Healthcare:</strong> HIPAA compliance requires robust encryption and access controls for patient data.</p>
        <p><strong>Finance:</strong> Banking documents need multi-layer security including digital signatures and audit trails.</p>
        <p><strong>Legal:</strong> Attorney-client privilege documents require the highest level of protection.</p>
        <p><strong>Government:</strong> Classified documents need specialized security protocols and clearance-based access.</p>

        <h3>Conclusion</h3>
        <p>PDF security is an ongoing process, not a one-time setup. Regular review and updates of your security measures ensure your documents remain protected against evolving threats.</p>
      `,
      category: "Security",
      readTime: "6 min",
      author: "Security Team",
      date: "December 12, 2024",
      tags: ["Security", "Encryption", "Password Protection", "Digital Signatures"],
      featured: true
    },
    {
      id: "3",
      title: "Optimizing PDF File Sizes: Compression Techniques That Work",
      excerpt: "Discover proven methods to reduce PDF file sizes without compromising quality, perfect for email sharing and web publishing.",
      content: `
        <h2>Why PDF File Size Matters</h2>
        <p>Large PDF files can be problematic for email attachments, web loading times, and storage costs. Learning effective compression techniques helps you balance quality with practicality.</p>

        <h3>Understanding PDF Compression</h3>
        <p>PDF compression works by reducing redundant data and optimizing how information is stored within the file. There are two main types:</p>
        
        <p><strong>Lossless Compression:</strong> Reduces file size without quality loss, ideal for text-heavy documents.</p>
        <p><strong>Lossy Compression:</strong> Achieves greater size reduction by selectively removing data, best for image-heavy files.</p>

        <h3>Compression Techniques</h3>
        <h4>1. Image Optimization</h4>
        <ul>
          <li>Reduce image resolution for web viewing (150 DPI vs 300 DPI for print)</li>
          <li>Convert color images to grayscale when color isn't essential</li>
          <li>Use JPEG compression for photographs, PNG for graphics with few colors</li>
          <li>Remove unnecessary metadata from embedded images</li>
        </ul>

        <h4>2. Font Optimization</h4>
        <ul>
          <li>Subset fonts to include only used characters</li>
          <li>Convert text to outlines only when absolutely necessary</li>
          <li>Use standard fonts when possible to reduce embedding needs</li>
        </ul>

        <h4>3. Content Optimization</h4>
        <ul>
          <li>Remove unused bookmarks, comments, and form fields</li>
          <li>Eliminate duplicate resources and redundant data</li>
          <li>Optimize PDF structure and cross-reference tables</li>
          <li>Remove hidden layers and unnecessary metadata</li>
        </ul>

        <h3>Compression Levels and Use Cases</h3>
        <p><strong>Maximum Quality (Minimal Compression):</strong> Professional printing, legal documents, archival storage</p>
        <p><strong>High Quality:</strong> Business presentations, detailed reports with images</p>
        <p><strong>Medium Quality:</strong> General sharing, email attachments, web viewing</p>
        <p><strong>Low Quality:</strong> Quick previews, large batch distributions, bandwidth-limited scenarios</p>

        <h3>Advanced Compression Strategies</h3>
        <p><strong>Selective Compression:</strong> Apply different compression levels to different elements within the same PDF.</p>
        <p><strong>Progressive Compression:</strong> Allow web browsers to display pages as they load, improving perceived performance.</p>
        <p><strong>Batch Optimization:</strong> Process multiple files with consistent settings for efficiency.</p>

        <h3>Common Compression Mistakes to Avoid</h3>
        <ol>
          <li><strong>Over-compressing Text:</strong> Can make documents unreadable or unprofessional</li>
          <li><strong>Ignoring Original Quality:</strong> Starting with low-quality source files limits compression options</li>
          <li><strong>One-Size-Fits-All:</strong> Different document types require different compression approaches</li>
          <li><strong>Forgetting Accessibility:</strong> Over-compression can affect screen reader compatibility</li>
        </ol>

        <h3>Tools and Techniques</h3>
        <p>Professional PDF compression tools offer advanced options like:</p>
        <ul>
          <li>Automated optimization based on intended use</li>
          <li>Preview capabilities to check quality before finalizing</li>
          <li>Batch processing for multiple files</li>
          <li>Custom compression profiles for different scenarios</li>
        </ul>

        <h3>Conclusion</h3>
        <p>Effective PDF compression is both an art and a science. By understanding your specific needs and applying the right techniques, you can achieve optimal file sizes while maintaining the quality your documents require.</p>
      `,
      category: "Optimization",
      readTime: "7 min",
      author: "Technical Team",
      date: "December 10, 2024",
      tags: ["Compression", "File Size", "Optimization", "Web Performance"],
      featured: false
    },
    {
      id: "4",
      title: "Digital Document Workflows: Streamlining Business Processes",
      excerpt: "Transform your business efficiency with modern digital document workflows using PDF tools and automation strategies.",
      content: `
        <h2>The Evolution of Document Workflows</h2>
        <p>Traditional paper-based workflows are rapidly becoming obsolete. Modern businesses require digital document workflows that are fast, secure, and scalable. PDF tools play a central role in this transformation.</p>

        <h3>Components of an Effective Digital Workflow</h3>
        <h4>1. Document Creation and Standardization</h4>
        <ul>
          <li>Template-based document creation for consistency</li>
          <li>Automated formatting and branding application</li>
          <li>Integration with existing business systems</li>
          <li>Version control and revision tracking</li>
        </ul>

        <h4>2. Collaboration and Review Processes</h4>
        <ul>
          <li>Real-time collaborative editing and commenting</li>
          <li>Structured review and approval workflows</li>
          <li>Digital signatures for authorization</li>
          <li>Audit trails for compliance and accountability</li>
        </ul>

        <h4>3. Distribution and Access Management</h4>
        <ul>
          <li>Secure document sharing with access controls</li>
          <li>Mobile-friendly access for remote teams</li>
          <li>Integration with cloud storage platforms</li>
          <li>Automated distribution based on business rules</li>
        </ul>

        <h3>Industry-Specific Workflow Examples</h3>
        <p><strong>Legal Firms:</strong> Contract review workflows with redlining, approvals, and e-signature integration.</p>
        <p><strong>Healthcare:</strong> Patient record management with HIPAA-compliant sharing and access controls.</p>
        <p><strong>Financial Services:</strong> Loan processing workflows with document verification and compliance checking.</p>
        <p><strong>Manufacturing:</strong> Quality control documentation with real-time updates and mobile access.</p>

        <h3>Workflow Automation Benefits</h3>
        <ul>
          <li><strong>Time Savings:</strong> Reduce manual processing time by up to 80%</li>
          <li><strong>Error Reduction:</strong> Minimize human errors through automated validation</li>
          <li><strong>Compliance:</strong> Ensure consistent adherence to regulatory requirements</li>
          <li><strong>Transparency:</strong> Real-time visibility into process status and bottlenecks</li>
          <li><strong>Scalability:</strong> Handle increased volume without proportional staff increases</li>
        </ul>

        <h3>Implementation Best Practices</h3>
        <ol>
          <li><strong>Process Mapping:</strong> Document current workflows before digitization</li>
          <li><strong>Stakeholder Engagement:</strong> Involve all affected parties in the design process</li>
          <li><strong>Phased Rollout:</strong> Implement changes gradually to ensure adoption</li>
          <li><strong>Training and Support:</strong> Provide comprehensive user education</li>
          <li><strong>Continuous Improvement:</strong> Regular review and optimization of workflows</li>
        </ol>

        <h3>Technology Integration</h3>
        <p>Modern digital workflows integrate multiple technologies:</p>
        <ul>
          <li><strong>Cloud Storage:</strong> Centralized document repositories with global access</li>
          <li><strong>Mobile Apps:</strong> On-the-go document access and processing</li>
          <li><strong>AI and ML:</strong> Intelligent document processing and data extraction</li>
          <li><strong>API Integration:</strong> Seamless connection with existing business systems</li>
        </ul>

        <h3>Security Considerations</h3>
        <p>Digital workflows must maintain security throughout the document lifecycle:</p>
        <ul>
          <li>End-to-end encryption for data in transit and at rest</li>
          <li>Role-based access controls and permission management</li>
          <li>Regular security audits and penetration testing</li>
          <li>Compliance with industry-specific regulations</li>
        </ul>

        <h3>Measuring Workflow Success</h3>
        <p>Key performance indicators for digital workflows:</p>
        <ul>
          <li><strong>Processing Time:</strong> Time from initiation to completion</li>
          <li><strong>Error Rates:</strong> Frequency of mistakes and rework</li>
          <li><strong>User Adoption:</strong> Percentage of users actively using the system</li>
          <li><strong>Cost Savings:</strong> Reduction in operational expenses</li>
          <li><strong>Compliance Score:</strong> Adherence to regulatory requirements</li>
        </ul>

        <h3>Future Trends</h3>
        <p>The future of digital document workflows includes:</p>
        <ul>
          <li>Increased AI integration for intelligent automation</li>
          <li>Enhanced mobile capabilities for remote work</li>
          <li>Blockchain for document authenticity and immutable records</li>
          <li>Advanced analytics for workflow optimization</li>
        </ul>

        <h3>Conclusion</h3>
        <p>Digital document workflows represent a fundamental shift in how businesses operate. By embracing these technologies and best practices, organizations can achieve significant improvements in efficiency, accuracy, and customer satisfaction.</p>
      `,
      category: "Business",
      readTime: "9 min",
      author: "Business Solutions Team",
      date: "December 8, 2024",
      tags: ["Workflow", "Business Process", "Automation", "Digital Transformation"],
      featured: false
    },
    {
      id: "5",
      title: "Accessibility in PDF Documents: Creating Inclusive Content",
      excerpt: "Learn how to create accessible PDF documents that serve all users, including those with disabilities, while meeting compliance requirements.",
      content: `
        <h2>Understanding PDF Accessibility</h2>
        <p>Accessible PDF documents ensure that all users, including those with disabilities, can effectively access and interact with your content. This isn't just about compliance—it's about creating inclusive experiences for everyone.</p>

        <h3>Why Accessibility Matters</h3>
        <ul>
          <li><strong>Legal Compliance:</strong> Many jurisdictions require accessible documents for public and business use</li>
          <li><strong>Wider Audience:</strong> Make your content available to users with visual, auditory, or cognitive impairments</li>
          <li><strong>Better SEO:</strong> Well-structured, accessible content performs better in search engines</li>
          <li><strong>Improved Usability:</strong> Accessible documents are often easier for everyone to use</li>
        </ul>

        <h3>Key Accessibility Features</h3>
        <h4>1. Document Structure</h4>
        <ul>
          <li>Proper heading hierarchy (H1, H2, H3, etc.)</li>
          <li>Logical reading order for screen readers</li>
          <li>Meaningful document titles and metadata</li>
          <li>Clear navigation and bookmarks</li>
        </ul>

        <h4>2. Alternative Text for Images</h4>
        <ul>
          <li>Descriptive alt text for informative images</li>
          <li>Empty alt text for decorative images</li>
          <li>Complex image descriptions when necessary</li>
          <li>Proper tagging of image elements</li>
        </ul>

        <h4>3. Color and Contrast</h4>
        <ul>
          <li>Sufficient color contrast ratios (minimum 4.5:1 for normal text)</li>
          <li>Information not conveyed by color alone</li>
          <li>Consistent color schemes throughout the document</li>
          <li>High contrast mode compatibility</li>
        </ul>

        <h3>Creating Accessible Forms</h3>
        <p>PDF forms require special attention for accessibility:</p>
        <ul>
          <li>Descriptive field labels and instructions</li>
          <li>Proper tab order for keyboard navigation</li>
          <li>Error identification and correction guidance</li>
          <li>Grouping related form fields logically</li>
        </ul>

        <h3>Table Accessibility</h3>
        <p>Tables must be properly structured for screen reader users:</p>
        <ul>
          <li>Table headers clearly identified</li>
          <li>Row and column headers associated with data cells</li>
          <li>Table summaries for complex data</li>
          <li>Avoiding tables for layout purposes</li>
        </ul>

        <h3>Testing Your PDFs for Accessibility</h3>
        <ol>
          <li><strong>Automated Testing:</strong> Use built-in accessibility checkers in PDF software</li>
          <li><strong>Screen Reader Testing:</strong> Test with actual assistive technology</li>
          <li><strong>Keyboard Navigation:</strong> Ensure all content is reachable via keyboard</li>
          <li><strong>User Testing:</strong> Get feedback from users with disabilities</li>
        </ol>

        <h3>Common Accessibility Mistakes</h3>
        <ul>
          <li><strong>Scanned Images as Text:</strong> Always use OCR to make text searchable and readable</li>
          <li><strong>Poor Reading Order:</strong> Ensure content flows logically for screen readers</li>
          <li><strong>Missing Alt Text:</strong> Every informative image needs descriptive alternative text</li>
          <li><strong>Inaccessible Forms:</strong> Form fields must be properly labeled and structured</li>
          <li><strong>Low Contrast:</strong> Text must meet minimum contrast requirements</li>
        </ul>

        <h3>Tools and Techniques</h3>
        <p><strong>Accessibility Checkers:</strong> Built-in tools in Adobe Acrobat, PDF/UA validators, and third-party testing tools.</p>
        <p><strong>Screen Readers:</strong> NVDA, JAWS, VoiceOver for testing actual user experience.</p>
        <p><strong>Contrast Analyzers:</strong> Tools to verify color contrast ratios meet standards.</p>

        <h3>Accessibility Standards and Guidelines</h3>
        <ul>
          <li><strong>WCAG 2.1:</strong> Web Content Accessibility Guidelines for digital content</li>
          <li><strong>PDF/UA:</strong> Universal Accessibility standard specifically for PDF documents</li>
          <li><strong>Section 508:</strong> US federal accessibility requirements</li>
          <li><strong>ADA:</strong> Americans with Disabilities Act compliance considerations</li>
        </ul>

        <h3>Best Practices for Content Authors</h3>
        <ol>
          <li><strong>Start with Structure:</strong> Use proper headings and styles in source documents</li>
          <li><strong>Plan for Accessibility:</strong> Consider accessibility from the beginning of document creation</li>
          <li><strong>Regular Training:</strong> Keep up-to-date with accessibility best practices</li>
          <li><strong>User Feedback:</strong> Actively seek input from users with disabilities</li>
        </ol>

        <h3>Return on Investment</h3>
        <p>Accessible documents provide measurable benefits:</p>
        <ul>
          <li>Expanded market reach and customer base</li>
          <li>Reduced legal risk and compliance costs</li>
          <li>Improved brand reputation and social responsibility</li>
          <li>Better search engine optimization results</li>
        </ul>

        <h3>Conclusion</h3>
        <p>Creating accessible PDF documents is an investment in inclusivity that benefits everyone. By following established guidelines and best practices, you can ensure your content reaches its full potential audience while meeting legal and ethical obligations.</p>
      `,
      category: "Accessibility",
      readTime: "8 min",
      author: "Accessibility Team",
      date: "December 5, 2024",
      tags: ["Accessibility", "WCAG", "Compliance", "Inclusive Design"],
      featured: false
    }
  ];

  const categories = ["All", "Conversion", "Security", "Optimization", "Business", "Accessibility"];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = articles.filter(article => article.featured);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedArticle(null)}
              className="mb-4"
            >
              ← Back to Articles
            </Button>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary">{selectedArticle.category}</Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedArticle.readTime} read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedArticle.title}</h1>
            <p className="text-xl text-gray-600 mb-6">{selectedArticle.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {selectedArticle.author}
              </span>
              <span>{selectedArticle.date}</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
          />
          
          {/* Tags */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Related Articles */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles
                .filter(article => 
                  article.id !== selectedArticle.id && 
                  article.category === selectedArticle.category
                )
                .slice(0, 2)
                .map((article, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{article.excerpt}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedArticle(article)}
                        className="w-full"
                      >
                        Read Article
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge className="bg-blue-700 text-blue-100 mb-4">
              <BookOpen className="w-4 h-4 mr-2" />
              Educational Hub
            </Badge>
            <h1 className="text-5xl font-bold mb-6">Learn More About PDF Tools</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Master PDF conversion, security, and optimization with our comprehensive guides. 
              Expert insights and practical tips to help you work smarter with documents.
            </p>
          </div>

          {/* Company Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="bg-blue-800/50 rounded-lg p-6">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-200" />
              <div className="text-3xl font-bold">10M+</div>
              <div className="text-blue-200">Users Served</div>
            </div>
            <div className="bg-blue-800/50 rounded-lg p-6">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-200" />
              <div className="text-3xl font-bold">20+</div>
              <div className="text-blue-200">PDF Tools</div>
            </div>
            <div className="bg-blue-800/50 rounded-lg p-6">
              <Award className="w-8 h-8 mx-auto mb-2 text-blue-200" />
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-blue-200">Uptime</div>
            </div>
            <div className="bg-blue-800/50 rounded-lg p-6">
              <Shield className="w-8 h-8 mx-auto mb-2 text-blue-200" />
              <div className="text-3xl font-bold">100%</div>
              <div className="text-blue-200">Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Search and Filter */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Articles */}
        {selectedCategory === "All" && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <Card key={article.id} className="cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {article.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-xl mb-2">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {article.author}
                      </div>
                      <Button 
                        onClick={() => setSelectedArticle(article)}
                        className="group"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Articles */}
        <section>
          <h2 className="text-3xl font-bold mb-8">
            {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {article.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-gray-600 mb-4 flex-1">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">{article.date}</div>
                    <Button 
                      size="sm"
                      onClick={() => setSelectedArticle(article)}
                    >
                      Read
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search terms or category filter.</p>
            </div>
          )}
        </section>

        {/* Company Info */}
        <section className="mt-16 pt-12 border-t bg-white rounded-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">About PDF Convert Master</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Developed by Mizan Store Ltd in London, UK, PDF Convert Master provides professional-grade 
              PDF tools trusted by millions worldwide. Our mission is to make document management 
              simple, secure, and accessible for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-blue-600 mb-3" />
              <h4 className="font-semibold mb-2">Enterprise Security</h4>
              <p className="text-sm text-gray-600">Bank-level encryption and compliance standards</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-12 h-12 text-blue-600 mb-3" />
              <h4 className="font-semibold mb-2">Lightning Fast</h4>
              <p className="text-sm text-gray-600">Optimized processing for quick results</p>
            </div>
            <div className="flex flex-col items-center">
              <Settings className="w-12 h-12 text-blue-600 mb-3" />
              <h4 className="font-semibold mb-2">20+ Tools</h4>
              <p className="text-sm text-gray-600">Complete PDF solution suite</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

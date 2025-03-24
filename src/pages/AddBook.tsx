
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Scan,
  Search,
  Plus,
  Minus,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Book } from '@/types';
import BarcodeScanner from '@/components/BarcodeScanner';
import { parseOpenLibraryBook, searchByISBN } from '@/services/openLibraryApi';
import { mockBooks } from '@/data/mockData';

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publishedYear: string;
  description: string;
  cover: string;
  quantity: number;
}

const AddBook = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishedYear: '',
    description: '',
    cover: '',
    quantity: 1
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Fetch book details if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchBook = async () => {
        setLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const book = mockBooks.find(b => b.id === id);
        
        if (book) {
          setFormData({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            publisher: book.publisher || '',
            publishedYear: book.publishedYear ? book.publishedYear.toString() : '',
            description: book.description || '',
            cover: book.cover || '',
            quantity: book.quantity
          });
        } else {
          toast.error('Book not found');
          navigate('/catalog');
        }
        
        setLoading(false);
      };
      
      fetchBook();
    }
  }, [id, isEditMode, navigate]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle quantity changes
  const handleQuantityChange = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + amount)
    }));
  };
  
  // Handle ISBN search
  const handleIsbnSearch = async (isbn: string) => {
    if (!isbn.trim()) {
      toast.error('Please enter an ISBN to search');
      return;
    }
    
    setIsbnLoading(true);
    try {
      const bookData = await searchByISBN(isbn);
      
      if (bookData) {
        const parsedBook = parseOpenLibraryBook(bookData);
        
        setFormData({
          title: parsedBook.title || '',
          author: parsedBook.author || '',
          isbn: parsedBook.isbn || isbn,
          publisher: parsedBook.publisher || '',
          publishedYear: parsedBook.publishedYear ? parsedBook.publishedYear.toString() : '',
          description: parsedBook.description || '',
          cover: parsedBook.cover || '',
          quantity: formData.quantity
        });
        
        toast.success('Book information found!');
      } else {
        toast.error('No book found with this ISBN');
      }
    } catch (error) {
      console.error('Error searching ISBN:', error);
      toast.error('Error searching for book');
    } finally {
      setIsbnLoading(false);
    }
  };
  
  // Handle scanner detection
  const handleScannerDetection = (detectedIsbn: string) => {
    setFormData(prev => ({ ...prev, isbn: detectedIsbn }));
    setShowScanner(false);
    handleIsbnSearch(detectedIsbn);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.author || !formData.isbn) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new book to add to the mockBooks array
      if (!isEditMode) {
        const newBook: Book = {
          id: (mockBooks.length + 1).toString(),
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          publisher: formData.publisher,
          publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
          description: formData.description,
          cover: formData.cover,
          quantity: formData.quantity,
          availableQuantity: formData.quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add the new book to the global mockBooks array
        mockBooks.push(newBook);
        
        toast.success(`Book "${formData.title}" added successfully`);
        console.log('Book added:', newBook);
        console.log('Updated book list:', mockBooks);
      } else {
        // Find and update the book
        const bookIndex = mockBooks.findIndex(b => b.id === id);
        if (bookIndex >= 0) {
          mockBooks[bookIndex] = {
            ...mockBooks[bookIndex],
            title: formData.title,
            author: formData.author,
            isbn: formData.isbn,
            publisher: formData.publisher,
            publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
            description: formData.description,
            cover: formData.cover,
            quantity: formData.quantity,
            updatedAt: new Date().toISOString()
          };
          
          toast.success(`Book "${formData.title}" updated successfully`);
        }
      }
      
      // Redirect to catalog page after successful submission
      setTimeout(() => {
        navigate('/catalog');
      }, 1000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while saving the book');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading book data...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Catalog
            </Link>
          </Button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h1>{isEditMode ? 'Edit Book' : 'Add New Book'}</h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? 'Update the information for this book'
                : 'Fill in the details to add a new book to the catalog'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ISBN section with scanner */}
            <div className="p-6 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">ISBN Lookup</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Barcode
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    placeholder="Enter ISBN (e.g., 9780061120084)"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => handleIsbnSearch(formData.isbn)}
                    disabled={isbnLoading}
                  >
                    {isbnLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    {isbnLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Enter an ISBN and click Search to automatically fill book details, or use the scanner.
              </p>
            </div>
            
            {/* Book details form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Book title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="author">
                    Author <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="Author name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    placeholder="Publisher name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="publishedYear">Year Published</Label>
                  <Input
                    id="publishedYear"
                    name="publishedYear"
                    value={formData.publishedYear}
                    onChange={handleChange}
                    placeholder="Year of publication"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={formData.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      type="number"
                      min="1"
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cover">Cover Image URL</Label>
                  <Input
                    id="cover"
                    name="cover"
                    value={formData.cover}
                    onChange={handleChange}
                    placeholder="URL to book cover image"
                  />
                  
                  <div className="mt-2 border rounded-md p-2 aspect-[2/3] flex items-center justify-center bg-muted">
                    {formData.cover ? (
                      <img
                        src={formData.cover}
                        alt="Book cover preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2" />
                        <p>Cover preview</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Book description"
                    rows={5}
                  />
                </div>
              </div>
            </div>
            
            {/* Form actions */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/catalog')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Book' : 'Save Book'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        
        {/* Barcode scanner modal */}
        <BarcodeScanner
          onDetected={handleScannerDetection}
          isVisible={showScanner}
          onClose={() => setShowScanner(false)}
        />
      </div>
    </Layout>
  );
};

export default AddBook;

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import AdminLayout from '@/components/admin/AdminLayout';
import Toast, { ToastType } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Search, Filter, Download, Eye, Calendar, User, MessageSquare, RefreshCw, Trash2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon, Copy, Check, RotateCw, Maximize2, Bot, Activity, FileText, Clock, Hash, ChevronsUp, ChevronsDown } from 'lucide-react';
import { chatHistoryAPI } from '@/services/api';
import { checkSession } from '@/utils/auth';
import { ConversationSummary, ConversationDetail, ChatHistoryStats } from '@/types/api';

// Confirm modal state type
interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  type: 'danger' | 'warning' | 'info';
  icon: 'power' | 'powerOff' | 'delete' | 'warning';
  onConfirm: () => void;
}

// Image Modal Component for viewing images in detail (same as chat-bot page)
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt?: string;
  allImages?: string[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  isOpen, 
  onClose, 
  imageSrc, 
  imageAlt = 'Image',
  allImages = [],
  currentIndex = 0,
  onNavigate
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => {
    setPortalMounted(true);
    return () => setPortalMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 5));
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.25));
      if (e.key === 'r') setRotation(r => (r + 90) % 360);
      if (e.key === '0') { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); }
      if (e.key === 'ArrowLeft' && onNavigate) onNavigate('prev');
      if (e.key === 'ArrowRight' && onNavigate) onNavigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.min(Math.max(s + delta, 0.25), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !portalMounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Control Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-full px-3 xs:px-4 py-2 flex items-center gap-2 xs:gap-3 z-10">
        <button
          onClick={() => setScale(s => Math.max(s - 0.25, 0.25))}
          className="p-1.5 xs:p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
        <span className="text-white text-xs xs:text-sm min-w-[50px] xs:min-w-[60px] text-center font-medium">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.min(s + 0.25, 5))}
          className="p-1.5 xs:p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
        <div className="w-px h-5 xs:h-6 bg-white/30" />
        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-1.5 xs:p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Xoay (R)"
        >
          <RotateCw className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
        <button
          onClick={() => { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); }}
          className="p-1.5 xs:p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Đặt lại (0)"
        >
          <Maximize2 className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
        <div className="w-px h-5 xs:h-6 bg-white/30" />
        <button
          onClick={handleDownload}
          className="p-1.5 xs:p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Tải xuống"
        >
          <Download className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
      </div>

      {/* Image counter */}
      {allImages.length > 1 && (
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 text-white text-sm font-medium z-10">
          {currentIndex + 1} / {allImages.length}
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        title="Đóng (Esc)"
      >
        <X className="w-5 h-5 xs:w-6 xs:h-6" />
      </button>

      {/* Navigation Arrows */}
      {allImages.length > 1 && onNavigate && (
        <>
          <button
            onClick={() => onNavigate('prev')}
            className="absolute left-2 xs:left-4 top-1/2 -translate-y-1/2 p-2 xs:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Ảnh trước (←)"
          >
            <ChevronLeft className="w-6 h-6 xs:w-8 xs:h-8" />
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="absolute right-2 xs:right-4 top-1/2 -translate-y-1/2 p-2 xs:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Ảnh sau (→)"
          >
            <ChevronRight className="w-6 h-6 xs:w-8 xs:h-8" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div 
        className="relative overflow-hidden w-full h-full flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          className="max-w-[90vw] max-h-[85vh] object-contain select-none transition-transform duration-200"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 max-w-[90vw] overflow-x-auto z-10">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate && (idx < currentIndex ? Array(currentIndex - idx).fill(0).forEach(() => onNavigate('prev')) : Array(idx - currentIndex).fill(0).forEach(() => onNavigate('next')))}
              className={`flex-shrink-0 w-12 h-12 xs:w-14 xs:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex 
                  ? 'border-white ring-2 ring-white/50' 
                  : 'border-transparent hover:border-white/50'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs hidden sm:block">
        <span className="bg-white/10 px-2 py-1 rounded">Cuộn</span> zoom • 
        <span className="bg-white/10 px-2 py-1 rounded mx-1">R</span> xoay • 
        <span className="bg-white/10 px-2 py-1 rounded">←→</span> chuyển ảnh • 
        <span className="bg-white/10 px-2 py-1 rounded ml-1">Esc</span> đóng
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const ChatHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [stats, setStats] = useState<ChatHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // Modal states
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Export states
  const [exporting, setExporting] = useState(false);
  
  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);
  const [allPreviewImages, setAllPreviewImages] = useState<string[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

  // Portal mount state
  const [mounted, setMounted] = useState(false);

  // Ref for scroll-to-top/bottom in detail modal
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    type: 'warning',
    icon: 'warning',
    onConfirm: () => {},
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const showConfirm = (config: Omit<ConfirmState, 'isOpen'>) => {
    setConfirmModal({ ...config, isOpen: true });
  };

  const hideConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const filters = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'completed', label: 'Đã hoàn thành' }
  ];

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await chatHistoryAPI.getConversations(
        itemsPerPage,
        offset,
        searchTerm || undefined,
        selectedFilter !== 'all' ? selectedFilter : undefined
      );
      
      setConversations(response.conversations || []);
      setTotalItems(response.total || 0);
      
      // Update stats from response
      if (response.stats) {
        setStats({
          total_conversations: response.stats.total_conversations,
          total_messages: response.stats.total_messages,
          today_conversations: response.stats.today_conversations,
          active_conversations: response.stats.active_conversations,
          avg_confidence: 0,
          avg_processing_time: 0,
          popular_topics: []
        });
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Không thể tải lịch sử chat. Vui lòng thử lại sau.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedFilter]);

  // Initial fetch
  useEffect(() => {
    const { isAuthenticated } = checkSession();
    if (!isAuthenticated) return;
    fetchConversations();
  }, [fetchConversations]);

  // View conversation detail
  const handleViewDetail = async (conversationId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await chatHistoryAPI.getConversationDetail(conversationId);
      setSelectedConversation(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching conversation detail:', err);
      alert('Không thể tải chi tiết cuộc hội thoại');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Delete conversation
  const handleDelete = async (conversationId: string) => {
    showConfirm({
      title: 'Xóa cuộc hội thoại',
      message: `Bạn có chắc muốn xóa cuộc hội thoại này?\n\nID: ${conversationId}\n\nHành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        hideConfirm();
        try {
          await chatHistoryAPI.deleteConversation(conversationId);
          await fetchConversations();
          showToast('Đã xóa cuộc hội thoại thành công', 'success');
        } catch (err) {
          console.error('Error deleting conversation:', err);
          showToast(err instanceof Error ? err.message : 'Không thể xóa cuộc hội thoại', 'error');
        }
      },
    });
  };

  // Export conversations
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await chatHistoryAPI.exportConversations();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Không thể xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  // Open image preview with gallery support
  const openImagePreview = (imageUrl: string, allImages: string[], currentIndex: number) => {
    setPreviewImage(imageUrl);
    setAllPreviewImages(allImages);
    setPreviewImageIndex(currentIndex);
  };

  // Navigate images in gallery
  const navigateImage = (direction: 'prev' | 'next') => {
    if (allPreviewImages.length <= 1) return;
    
    let newIndex = direction === 'next' 
      ? (previewImageIndex + 1) % allPreviewImages.length
      : (previewImageIndex - 1 + allPreviewImages.length) % allPreviewImages.length;
    
    setPreviewImageIndex(newIndex);
    setPreviewImage(allPreviewImages[newIndex]);
  };

  // Close image preview
  const closeImagePreview = () => {
    setPreviewImage(null);
    setAllPreviewImages([]);
    setPreviewImageIndex(0);
  };

  // Copy message to clipboard
  const copyMessage = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download image
  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Search Box */}
            <div className="relative w-full">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo nội dung cuộc hội thoại..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-12 pl-12 pr-11 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-0 bottom-0 flex items-center p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filter Dropdown */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                  value={selectedFilter}
                  onChange={(e) => {
                    setSelectedFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300 cursor-pointer transition-all appearance-none bg-white"
                >
                  {filters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 sm:ml-auto">
                <button 
                  onClick={fetchConversations}
                  disabled={loading}
                  className="h-10 px-3 sm:px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>

                <button 
                  onClick={handleExport}
                  disabled={exporting}
                  className="h-10 px-3 sm:px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm text-sm font-medium"
                  title="Xuất dữ liệu"
                >
                  <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">{exporting ? 'Đang xuất...' : 'Export'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 xs:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs xs:text-sm text-gray-600">Tổng cuộc hội thoại</p>
                <p className="text-xl xs:text-2xl font-bold text-gray-900 mt-1">
                  {stats?.total_conversations || 0}
                </p>
              </div>
              <MessageSquare className="w-6 h-6 xs:w-8 xs:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 xs:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs xs:text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-xl xs:text-2xl font-bold text-green-600 mt-1">
                  {stats?.active_conversations || 0}
                </p>
              </div>
              <User className="w-6 h-6 xs:w-8 xs:h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 xs:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs xs:text-sm text-gray-600">Hôm nay</p>
                <p className="text-xl xs:text-2xl font-bold text-purple-600 mt-1">
                  {stats?.today_conversations || 0}
                </p>
              </div>
              <Calendar className="w-6 h-6 xs:w-8 xs:h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 xs:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs xs:text-sm text-gray-600">Tổng tin nhắn</p>
                <p className="text-xl xs:text-2xl font-bold text-orange-600 mt-1">
                  {stats?.total_messages || 0}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Chat History Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="px-4 py-12 text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Đang tải...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không tìm thấy cuộc hội thoại nào</p>
              </div>
            ) : (
              conversations.map((chat) => (
                <div key={chat.conversation_id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-mono truncate">
                        ID: {chat.conversation_id.substring(0, 8)}...
                      </p>
                      <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">
                        {chat.first_query || 'Không có câu hỏi'}
                      </h3>
                    </div>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full shrink-0 ${
                      chat.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {chat.status === 'active' ? 'Hoạt động' : 'Hoàn thành'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{chat.message_count} tin nhắn</span>
                    <span className="text-xs">
                      {formatDate(chat.last_message)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleViewDetail(chat.conversation_id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(chat.conversation_id)}
                      className="flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Cuộc hội thoại
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Câu hỏi đầu tiên
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tin nhắn
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-600">Đang tải...</p>
                    </td>
                  </tr>
                ) : conversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Không tìm thấy cuộc hội thoại nào</p>
                    </td>
                  </tr>
                ) : (
                  conversations.map((chat) => (
                    <tr key={chat.conversation_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">
                          {chat.conversation_id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 line-clamp-2">
                          {chat.first_query || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{chat.message_count} tin nhắn</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(chat.last_message)}</div>
                        <div className="text-xs text-gray-500">
                          {chat.total_processing_time ? `${chat.total_processing_time.toFixed(1)}s` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          chat.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {chat.status === 'active' ? 'Đang hoạt động' : 'Đã hoàn thành'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleViewDetail(chat.conversation_id)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(chat.conversation_id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 xs:px-6 py-3 xs:py-4 border-t border-gray-200 flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-0">
              <p className="text-xs xs:text-sm text-gray-600 order-2 xs:order-1">
                <span className="hidden xs:inline">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} của {totalItems} kết quả
                </span>
                <span className="xs:hidden">
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}
                </span>
              </p>
              <div className="flex items-center space-x-2 order-1 xs:order-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5" />
                </button>
                <span className="px-3 xs:px-4 py-2 text-xs xs:text-sm text-gray-700">
                  <span className="hidden xs:inline">Trang </span>{currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {mounted && showDetailModal && selectedConversation && createPortal(
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 sm:p-3">
            <div className="bg-white w-full h-full sm:w-[96vw] sm:h-[96vh] sm:max-w-5xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">

              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 xs:px-6 py-3 xs:py-4 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h3 className="text-base xs:text-lg font-semibold">Chi tiết cuộc hội thoại</h3>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-red-100 text-xs">
                      <span className="font-mono bg-red-800/40 px-2 py-0.5 rounded truncate max-w-[240px]">
                        {selectedConversation.conversation_id}
                      </span>
                      {selectedConversation.first_message && (
                        <span className="flex items-center gap-1 opacity-90">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {formatDate(selectedConversation.first_message)}
                          {selectedConversation.last_message && selectedConversation.last_message !== selectedConversation.first_message && (
                            <span className="opacity-70 ml-1">→ {formatDate(selectedConversation.last_message)}</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
                    title="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="bg-white border-b border-gray-100 px-4 xs:px-6 py-2.5 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold">
                    <MessageSquare className="w-3 h-3" />
                    {selectedConversation.message_count} tin nhắn
                  </span>
                  <span className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedConversation.avg_confidence >= 0.7
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : selectedConversation.avg_confidence >= 0.5
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    <Activity className="w-3 h-3" />
                    Tin cậy TB {(selectedConversation.avg_confidence * 100).toFixed(0)}%
                  </span>
                  {selectedConversation.total_processing_time > 0 && (
                    <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-3 py-1 text-xs font-semibold">
                      <Clock className="w-3 h-3" />
                      {selectedConversation.total_processing_time.toFixed(1)}s tổng
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-3 xs:p-5" ref={messagesContainerRef}>
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center h-full py-16">
                    <RefreshCw className="w-8 h-8 text-gray-400 mb-4 animate-spin" />
                    <p className="text-gray-500 text-sm">Đang tải tin nhắn...</p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {selectedConversation.messages.map((msg, index) => (
                      <div key={index}>

                        {/* Message-number divider */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-px bg-gray-200" />
                          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm flex-shrink-0">
                            <Hash className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium">Tin nhắn {index + 1}</span>
                            {msg.timestamp && (
                              <>
                                <span className="text-gray-300 text-xs">·</span>
                                <span className="text-xs text-gray-400">{formatDate(msg.timestamp)}</span>
                              </>
                            )}
                          </div>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* User bubble */}
                        <div className="flex justify-end mb-3">
                          <div className="max-w-[90%] xs:max-w-[82%] lg:max-w-[72%] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm p-3 xs:p-4 shadow-md relative group">
                            <button
                              onClick={() => copyMessage(msg.user_message, msg.id)}
                              className="absolute top-2 right-2 p-1.5 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
                              title="Sao chép"
                            >
                              {copiedMessageId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                              <span className="text-xs font-semibold text-blue-100">Người dùng</span>
                            </div>
                            {(() => {
                              const userImages = msg.images ?? [];
                              return userImages.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2 justify-end">
                                  {userImages.map((imageUrl: string, imgIndex: number) => (
                                    <div
                                      key={imgIndex}
                                      className="relative group/img cursor-pointer"
                                      onClick={() => openImagePreview(imageUrl, userImages, imgIndex)}
                                    >
                                      <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-xl overflow-hidden border-2 border-white/30 hover:border-white/60 transition-all bg-blue-400/30">
                                        <img
                                          src={imageUrl}
                                          alt={`Hình ảnh ${imgIndex + 1}`}
                                          className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 rounded-xl transition-all flex items-center justify-center">
                                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                            <p className="text-sm xs:text-base break-words leading-relaxed pr-6">{msg.user_message}</p>
                          </div>
                        </div>

                        {/* AI bubble */}
                        <div className="flex justify-start">
                          <div className="max-w-[90%] xs:max-w-[82%] lg:max-w-[72%] bg-white rounded-2xl rounded-tl-sm border border-gray-200 shadow-md overflow-hidden relative group">

                            {/* AI bubble header */}
                            <div className="flex items-center justify-between px-3 xs:px-4 py-2 bg-gray-50 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                                  <Bot className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-gray-600">Trợ lý AI</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${
                                  msg.confidence >= 0.7
                                    ? 'bg-green-100 text-green-700'
                                    : msg.confidence >= 0.5
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  <Activity className="w-2.5 h-2.5" />
                                  {(msg.confidence * 100).toFixed(0)}%
                                </span>
                                {msg.processing_time > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-2 py-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {msg.processing_time.toFixed(1)}s
                                  </span>
                                )}
                                <button
                                  onClick={() => copyMessage(msg.assistant_response, msg.id + 1000)}
                                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-200"
                                  title="Sao chép"
                                >
                                  {copiedMessageId === msg.id + 1000 ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* AI message content */}
                            <div className="p-3 xs:p-4">
                              <div className="text-sm xs:text-base text-gray-800 leading-relaxed prose prose-sm max-w-none markdown-content">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-gray-800">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                                    code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>,
                                    pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2 text-sm">{children}</pre>,
                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-300 pl-3 italic text-gray-600 mb-2 bg-blue-50/50 py-1 rounded-r">{children}</blockquote>,
                                    table: ({ children }) => (
                                      <div className="overflow-x-auto my-3 rounded-lg border border-gray-200">
                                        <table className="min-w-full text-sm border-collapse">{children}</table>
                                      </div>
                                    ),
                                    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                                    th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">{children}</th>,
                                    td: ({ children }) => <td className="px-3 py-2 text-gray-800 border-b border-gray-100">{children}</td>,
                                    h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-3">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 mb-2 mt-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-bold text-gray-800 mb-1 mt-2">{children}</h3>,
                                  }}
                                >
                                  {msg.assistant_response}
                                </ReactMarkdown>
                              </div>

                              {/* Source chips */}
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tài liệu tham khảo</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {msg.sources.map((src, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1 font-medium max-w-[220px] truncate"
                                        title={src}
                                      >
                                        <FileText className="w-2.5 h-2.5 flex-shrink-0" />
                                        {src.replace('.pdf', '').replace(/_/g, ' ')}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                {/* Scroll-to-top / scroll-to-bottom floating buttons */}
                {!loadingDetail && selectedConversation.messages.length > 2 && (
                  <div className="sticky bottom-4 flex justify-end pointer-events-none">
                    <div className="flex flex-col gap-1.5 pointer-events-auto">
                      <button
                        onClick={() => messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-9 h-9 bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all"
                        title="Lên đầu"
                      >
                        <ChevronsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => messagesContainerRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })}
                        className="w-9 h-9 bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all"
                        title="Xuống cuối"
                      >
                        <ChevronsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-gray-100 px-4 xs:px-6 py-3 flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {selectedConversation.message_count} cặp hội thoại
                </span>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm shadow-sm"
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}

        {/* Image Modal - using the enhanced ImageModal component */}
        <ImageModal
          isOpen={!!previewImage}
          onClose={closeImagePreview}
          imageSrc={previewImage || ''}
          imageAlt="Hình ảnh từ cuộc hội thoại"
          allImages={allPreviewImages}
          currentIndex={previewImageIndex}
          onNavigate={navigateImage}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
          icon={confirmModal.icon}
          onConfirm={confirmModal.onConfirm}
          onClose={hideConfirm}
        />

        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    </AdminLayout>
  );
};

export default ChatHistoryPage;

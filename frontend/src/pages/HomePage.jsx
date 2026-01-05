import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../lib/api';
import { getImageUrl } from '../lib/imageUrl';
import Cropper from 'react-cropper';
import { 
  LogOut, Upload, Image as ImageIcon, Loader2, X, Trash2, Calendar, Tag, 
  ChevronLeft, ChevronRight, Info, Search, Plus, Camera, 
  Edit3, RotateCcw, RotateCw, Save, XCircle, Sun, Contrast, Palette, RefreshCw,
  CheckSquare, Square, Play, Pause, Maximize, Grid
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [images, setImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);

  // 多选与轮播状态
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideshowInterval, setSlideshowInterval] = useState(3000);
  const slideshowTimerRef = useRef(null);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const cropperRef = useRef(null);
  
  // 色调调整状态
  const [adjustments, setAdjustments] = useState({
    brightness: 100,  // 0-200, 100为正常
    contrast: 100,    // 0-200, 100为正常
    saturation: 100,  // 0-200, 100为正常
    hue: 0,           // -180 to 180
  });
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const [editMode, setEditMode] = useState('crop'); // 'crop' | 'tone'

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // --- 动态加载 Cropper CSS (CDN) ---
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
       // 不移除以免闪烁
    };
  }, []);

  // --- API 请求 ---
  const fetchImages = useCallback(async (query = searchQuery) => {
    try {
      setIsLoadingImages(true);
      const res = await api.get('/images', { params: { q: query } });
      setImages(res.data.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    } else {
      fetchImages('');
    }
  }, [navigate, fetchImages]);

  // 监听键盘
  useEffect(() => {
    if (selectedIndex === null || isEditing) return; 
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal();
      if (e.key === 'ArrowLeft') handlePrev(e);
      if (e.key === 'ArrowRight') handleNext(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, images.length, isEditing]);

  // 轮播自动播放
  useEffect(() => {
    if (!isSlideshow || !isPlaying) {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
        slideshowTimerRef.current = null;
      }
      return;
    }

    const slideshowImages = Array.from(selectedImages).map(id => images.find(img => img.ID === id)).filter(Boolean);
    if (slideshowImages.length === 0) return;

    slideshowTimerRef.current = setInterval(() => {
      setSlideshowIndex(prev => (prev + 1) % slideshowImages.length);
    }, slideshowInterval);

    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
      }
    };
  }, [isSlideshow, isPlaying, selectedImages, images, slideshowInterval]);

  // 轮播键盘控制
  useEffect(() => {
    if (!isSlideshow) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSlideshow();
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'ArrowLeft') handleSlideshowPrev();
      if (e.key === 'ArrowRight') handleSlideshowNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlideshow, selectedImages]);

  // --- 逻辑处理 ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileSelect = (e) => processFile(e.target.files?.[0]);
  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  const handleCancelUpload = () => { setSelectedFile(null); setPreviewUrl(null); };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    performUpload(selectedFile);
  };

  const performUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file); 
    try {
      await api.post('/images/upload', formData);
      alert('上传成功！');
      handleCancelUpload(); 
      setIsEditing(false);  
      fetchImages('');      
    } catch (err) {
      alert(`上传失败: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if(!confirm("确认删除？操作不可恢复。")) return;
    try {
      await api.delete(`/images/${id}`);
      if (selectedIndex !== null && images[selectedIndex].ID === id) {
        handleCloseModal();
      }
      setImages(prev => prev.filter(img => img.ID !== id));
    } catch (err) { alert("删除失败"); }
  };

  // --- 轮播逻辑 ---
  const openModal = (index) => setSelectedIndex(index);
  const handleCloseModal = () => {
    setSelectedIndex(null);
    setIsEditing(false);
    setTagInput('');
    // 重置色调调整
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100, hue: 0 });
    setEditMode('crop');
  };
  const handlePrev = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNext = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchImages(searchQuery);
  };

  // --- 标签逻辑 ---
  const updateTags = async (imageId, newTagsString) => {
    setIsUpdatingTag(true);
    try {
      await api.put(`/images/${imageId}/tags`, { tags: newTagsString });
      setImages(prev => prev.map(img => img.ID === imageId ? { ...img, tags: newTagsString } : img));
    } catch (err) { alert("标签更新失败"); } finally { setIsUpdatingTag(false); }
  };
  const handleAddTag = async () => {
    if (!tagInput.trim() || !activeImage) return;
    const currentTags = activeImage.tags ? activeImage.tags.split(',') : [];
    if (currentTags.includes(tagInput.trim())) { setTagInput(''); return; }
    await updateTags(activeImage.ID, [...currentTags, tagInput.trim()].filter(t=>t).join(','));
    setTagInput('');
  };
  const handleRemoveTag = async (tag) => {
    if (!activeImage) return;
    await updateTags(activeImage.ID, activeImage.tags.split(',').filter(t => t !== tag).join(','));
  };

  // 多选逻辑
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedImages(new Set());
    }
  };

  const toggleImageSelect = (e, imageId) => {
    e.stopPropagation();
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedImages(new Set(images.map(img => img.ID)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  // 轮播逻辑
  const startSlideshow = () => {
    if (selectedImages.size < 2) {
      alert('请至少选择2张图片进行轮播');
      return;
    }
    setSlideshowIndex(0);
    setIsPlaying(true);
    setIsSlideshow(true);
  };

  const closeSlideshow = () => {
    setIsSlideshow(false);
    setIsPlaying(false);
    setSlideshowIndex(0);
  };

  const handleSlideshowPrev = () => {
    const slideshowImages = Array.from(selectedImages);
    setSlideshowIndex(prev => (prev - 1 + slideshowImages.length) % slideshowImages.length);
  };

  const handleSlideshowNext = () => {
    const slideshowImages = Array.from(selectedImages);
    setSlideshowIndex(prev => (prev + 1) % slideshowImages.length);
  };

  const getSlideshowImages = () => {
    return Array.from(selectedImages).map(id => images.find(img => img.ID === id)).filter(Boolean);
  };

  // 图片编辑逻辑
  const handleRotateLeft = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) cropper.rotate(-90);
  };
  
  const handleRotateRight = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) cropper.rotate(90);
  };

  // 色调调整逻辑
  const resetAdjustments = () => {
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100, hue: 0 });
  };

  // 应用色调效果到 Canvas
  const applyAdjustmentsToCanvas = useCallback((img, canvas) => {
    if (!img || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    // 先绘制原图
    ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) hue-rotate(${adjustments.hue}deg)`;
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';
  }, [adjustments]);

  // 当色调参数变化时更新预览
  useEffect(() => {
    if (!isEditing || !originalImageRef.current || !canvasRef.current) return;
    applyAdjustmentsToCanvas(originalImageRef.current, canvasRef.current);
  }, [adjustments, isEditing, applyAdjustmentsToCanvas]);
  
  const handleSaveEdit = () => {
    // 如果有色调调整，使用 Canvas 保存
    const hasAdjustments = adjustments.brightness !== 100 || 
                          adjustments.contrast !== 100 || 
                          adjustments.saturation !== 100 || 
                          adjustments.hue !== 0;
    
    if (hasAdjustments && canvasRef.current) {
      // 从色调调整的 Canvas 获取图像
      canvasRef.current.toBlob((blob) => {
        if (!blob) {
          alert("图片生成失败");
          return;
        }
        const file = new File([blob], `edited-${activeImage.file_name}`, { type: "image/jpeg" });
        performUpload(file);
      }, "image/jpeg", 0.92);
      return;
    }

    // 否则使用 Cropper 的裁剪功能
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      console.error("Cropper 实例未找到");
      return;
    }
    
    // 获取 Canvas 数据
    const canvas = cropper.getCroppedCanvas();
    if (!canvas) {
      alert("无法获取图片数据。可能是图片尚未加载完成，或存在跨域问题。");
      return;
    }

    // 导出为 Blob 并上传
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("图片生成失败");
        return;
      }
      // 生成新文件对象
      const file = new File([blob], `edited-${activeImage.file_name}`, { type: "image/jpeg" });
      performUpload(file);
    }, "image/jpeg");
  };

  const handleImageError = (e) => { e.target.style.display = 'none'; };

  if (!localStorage.getItem('token')) return null;
  const activeImage = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => {setSearchQuery(''); fetchImages('');}}>
            <div className="bg-indigo-600 p-1.5 rounded"><ImageIcon className="text-white w-5 h-5"/></div>
            <span className="text-xl font-bold text-gray-900 hidden md:block">智能图库</span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500" />
            <input type="text" className="block w-full pl-10 pr-3 py-2 border rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </form>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-sm font-medium text-gray-900 hidden sm:block">{user.username}</span>
            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600">退出</button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* 上传区域 */}
        <div className="mb-8">
          {!previewUrl ? (
            <div 
              className={`h-24 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-white'}`}
              onDragOver={e => {e.preventDefault(); setIsDragOver(true)}}
              onDragLeave={e => {e.preventDefault(); setIsDragOver(false)}}
              onDrop={e => {e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files?.[0])}}
            >
              <label className="cursor-pointer w-full h-full flex items-center justify-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Upload className="w-5 h-5" /></div>
                <span className="text-gray-600 font-medium">点击或拖拽上传新图片</span>
                <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
              </label>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex gap-6 items-center animate-in fade-in slide-in-from-top-4">
              <img src={previewUrl} className="h-32 w-32 object-contain rounded-lg bg-gray-50 border" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">准备上传</h3>
                <p className="text-sm text-gray-500 mb-4">文件名: {selectedFile?.name}</p>
                <div className="flex gap-3">
                  <button onClick={handleCancelUpload} disabled={isUploading} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
                  <button onClick={handleUpload} disabled={isUploading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">{isUploading && <Loader2 className="w-4 h-4 animate-spin" />} 确认上传</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{searchQuery ? `"${searchQuery}" 结果` : '所有图片'} <span className="text-gray-400 text-sm">({images.length})</span></h2>
          
          {/* 多选控制按钮 */}
          <div className="flex items-center gap-2">
            {isSelectMode && selectedImages.size > 0 && (
              <>
                <span className="text-sm text-gray-600">已选 {selectedImages.size} 张</span>
                <button 
                  onClick={startSlideshow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Play className="w-4 h-4" /> 轮播
                </button>
                <button 
                  onClick={clearSelection}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  清除
                </button>
              </>
            )}
            {isSelectMode && selectedImages.size === 0 && (
              <button 
                onClick={selectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
              >
                全选
              </button>
            )}
            <button 
              onClick={toggleSelectMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSelectMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              {isSelectMode ? <CheckSquare className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              {isSelectMode ? '退出选择' : '多选'}
            </button>
          </div>
        </div>

        {isLoadingImages ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-200"/></div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((img, index) => (
              <div 
                key={img.ID} 
                onClick={() => isSelectMode ? toggleImageSelect({stopPropagation: ()=>{}}, img.ID) : openModal(index)} 
                className={`group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-${isSelectMode ? 'pointer' : 'zoom-in'} border-2 transition-all ${selectedImages.has(img.ID) ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200 hover:shadow-lg'}`}
              >
                {/* 选择框 */}
                {isSelectMode && (
                  <div 
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${selectedImages.has(img.ID) ? 'bg-indigo-600 text-white' : 'bg-white/80 text-gray-400 border border-gray-300'}`}
                    onClick={(e) => toggleImageSelect(e, img.ID)}
                  >
                    {selectedImages.has(img.ID) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </div>
                )}
                
                <img src={getImageUrl(img.thumbnail_url || img.url)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" onError={handleImageError} />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity flex flex-col justify-end p-3 ${isSelectMode ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'}`}>
                  {img.tags && <div className="flex flex-wrap gap-1 mb-1.5">{img.tags.split(',').filter(t=>t).slice(0,3).map((tag,i)=><span key={i} className="text-[10px] bg-white/20 text-white/90 px-1.5 py-0.5 rounded backdrop-blur-md">{tag}</span>)}</div>}
                  <p className="text-white text-sm font-medium truncate">{img.file_name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white/80 text-xs">{new Date(img.CreatedAt).toLocaleDateString()}</span>
                    {!isSelectMode && (
                      <button onClick={(e) => handleDelete(e, img.ID)} className="bg-white/20 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-md"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (<div className="py-20 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">暂无图片</div>)}
      </main>

      {/* --- 全屏模态框 --- */}
      {selectedIndex !== null && activeImage && (
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
          
          <button onClick={handleCloseModal} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 z-20"><X className="w-8 h-8" /></button>
          {!isEditing && (
            <>
              <button onClick={handlePrev} className="absolute left-2 md:left-4 top-1/3 md:top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"><ChevronLeft className="w-8 h-8 md:w-10 md:h-10" /></button>
              <button onClick={handleNext} className="absolute right-2 md:right-4 top-1/3 md:top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-2 rounded-full hover:bg-white/10 z-10 md:right-[340px]"><ChevronRight className="w-8 h-8 md:w-10 md:h-10" /></button>
            </>
          )}

          {/* 图片显示区域 */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black/50 rounded-lg">
              {isEditing ? (
                editMode === 'crop' ? (
                  <Cropper
                    src={getImageUrl(activeImage.url)}
                    style={{ height: "100%", width: "100%" }}
                    initialAspectRatio={NaN}
                    guides={true}
                    background={false}
                    ref={cropperRef}
                    viewMode={1}
                    dragMode="move"
                    autoCropArea={0.8}
                    checkOrientation={false}
                    crossOrigin="anonymous"
                  />
                ) : (
                  // 色调调整模式：显示带滤镜的预览
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      ref={originalImageRef}
                      src={getImageUrl(activeImage.url)} 
                      alt={activeImage.file_name} 
                      className="max-w-full max-h-full object-contain shadow-2xl"
                      crossOrigin="anonymous"
                      style={{
                        filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) hue-rotate(${adjustments.hue}deg)`
                      }}
                      onLoad={(e) => {
                        originalImageRef.current = e.target;
                        if (canvasRef.current) {
                          applyAdjustmentsToCanvas(e.target, canvasRef.current);
                        }
                      }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )
              ) : (
                <img src={getImageUrl(activeImage.url)} alt={activeImage.file_name} className="max-w-full max-h-full object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
              )}
            </div>
          </div>

          {/* 信息面板 - 手机端底部抽屉，桌面端右侧 */}
          <div className="md:w-80 max-h-[45vh] md:max-h-full md:h-full overflow-y-auto bg-gray-900/80 md:bg-gray-900/50 border-t md:border-t-0 md:border-l border-white/10 text-white p-4 md:p-6 backdrop-blur-md md:rounded-none rounded-t-2xl">
            <div className="flex-1 overflow-y-auto">
              {/* 手机端显示文件名和基本操作 */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg md:text-xl font-bold break-words flex-1 pr-2">{activeImage.file_name}</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Edit3 className="w-4 h-4" /> 编辑
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="animate-in fade-in slide-in-from-right-4">
                  {/* 编辑模式切换 */}
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => setEditMode('crop')} 
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${editMode === 'crop' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                    >
                      裁剪旋转
                    </button>
                    <button 
                      onClick={() => setEditMode('tone')} 
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${editMode === 'tone' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                    >
                      色调调整
                    </button>
                  </div>

                  {editMode === 'crop' ? (
                    <>
                      <p className="text-sm text-gray-400 mb-4">拖动裁剪框选择区域，或使用按钮旋转图片。</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={handleRotateLeft} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"><RotateCcw className="w-6 h-6" /> <span className="text-xs">左旋 90°</span></button>
                        <button onClick={handleRotateRight} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"><RotateCw className="w-6 h-6" /> <span className="text-xs">右旋 90°</span></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-400 mb-4">调整图片色调参数，实时预览效果。</p>
                      
                      {/* 色调调整滑块 */}
                      <div className="space-y-4 mb-4">
                        {/* 亮度 */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-gray-300 flex items-center gap-2"><Sun className="w-4 h-4 text-yellow-400" /> 亮度</label>
                            <span className="text-xs text-gray-400">{adjustments.brightness}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="200" 
                            value={adjustments.brightness} 
                            onChange={(e) => setAdjustments(prev => ({...prev, brightness: Number(e.target.value)}))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                          />
                        </div>
                        
                        {/* 对比度 */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-gray-300 flex items-center gap-2"><Contrast className="w-4 h-4 text-blue-400" /> 对比度</label>
                            <span className="text-xs text-gray-400">{adjustments.contrast}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="200" 
                            value={adjustments.contrast} 
                            onChange={(e) => setAdjustments(prev => ({...prev, contrast: Number(e.target.value)}))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                          />
                        </div>
                        
                        {/* 饱和度 */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-gray-300 flex items-center gap-2"><Palette className="w-4 h-4 text-pink-400" /> 饱和度</label>
                            <span className="text-xs text-gray-400">{adjustments.saturation}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="200" 
                            value={adjustments.saturation} 
                            onChange={(e) => setAdjustments(prev => ({...prev, saturation: Number(e.target.value)}))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-400"
                          />
                        </div>
                        
                        {/* 色相 */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-gray-300 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-green-400" /> 色相</label>
                            <span className="text-xs text-gray-400">{adjustments.hue}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="-180" 
                            max="180" 
                            value={adjustments.hue} 
                            onChange={(e) => setAdjustments(prev => ({...prev, hue: Number(e.target.value)}))}
                            className="w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                      
                      {/* 重置按钮 */}
                      <button 
                        onClick={resetAdjustments} 
                        className="w-full bg-white/10 hover:bg-white/20 text-gray-300 py-2 rounded-lg text-sm mb-4 transition-colors"
                      >
                        重置为默认值
                      </button>
                    </>
                  )}

                  <div className="flex gap-3">
                    <button onClick={handleSaveEdit} disabled={isUploading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">{isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> 保存</>}</button>
                    <button onClick={() => {setIsEditing(false); resetAdjustments();}} disabled={isUploading} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"><XCircle className="w-5 h-5" /> 取消</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(activeImage.CreatedAt).toLocaleString()}</p>
                  
                  {/* 标签区域 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-indigo-400" /> 标签</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {activeImage.tags?.split(',').filter(t=>t).map((tag, i) => (
                        <div key={i} className="group relative inline-flex">
                          <span onClick={() => {handleCloseModal(); fetchImages(tag);}} className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-indigo-600 text-sm cursor-pointer border border-white/5">{tag}</span>
                          <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-white/50 hover:text-red-400"><X className="w-3 h-3" /></button>
                        </div>
                      )) || <span className="text-gray-500 italic text-sm">暂无标签</span>}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="添加标签..." className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      <button onClick={handleAddTag} disabled={isUpdatingTag || !tagInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded">{isUpdatingTag ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  
                  {/* 拍摄参数 */}
                  <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Camera className="w-4 h-4 text-indigo-400" /> 拍摄参数</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                      <div><p className="text-gray-500 mb-0.5">相机</p><p className="text-white font-medium truncate">{activeImage.camera_model || '未知'}</p></div>
                      <div><p className="text-gray-500 mb-0.5">时间</p><p className="text-white font-medium">{activeImage.shooting_time || '未知'}</p></div>
                      <div><p className="text-gray-500 mb-0.5">分辨率</p><p className="text-white font-medium">{activeImage.resolution || '未知'}</p></div>
                      <div><p className="text-gray-500 mb-0.5">参数</p><div className="flex gap-2 text-white font-medium"><span>{activeImage.aperture || '-'}</span><span>ISO {activeImage.iso || '-'}</span></div></div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button onClick={(e) => handleDelete(e, activeImage.ID)} className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-600 text-red-100 hover:text-white py-2.5 rounded-lg transition-colors font-medium"><Trash2 className="w-4 h-4" /> 删除</button>
                    <a href={getImageUrl(activeImage.url)} target="_blank" download className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg transition-colors font-medium">下载</a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 轮播模态框 */}
      {isSlideshow && (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col animate-in fade-in duration-300">
          {/* 顶部控制栏 */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-white">
                <span className="text-lg font-medium">轮播模式</span>
                <span className="text-white/60 ml-3 text-sm">
                  {slideshowIndex + 1} / {getSlideshowImages().length}
                </span>
              </div>
              <button 
                onClick={closeSlideshow} 
                className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* 图片显示区域 */}
          <div className="flex-1 flex items-center justify-center p-8">
            {getSlideshowImages()[slideshowIndex] && (
              <img 
                key={getSlideshowImages()[slideshowIndex].ID}
                src={getImageUrl(getSlideshowImages()[slideshowIndex].url)} 
                alt={getSlideshowImages()[slideshowIndex].file_name}
                className="max-w-full max-h-full object-contain animate-in fade-in zoom-in-95 duration-500"
              />
            )}
          </div>

          {/* 左右切换按钮 */}
          <button 
            onClick={handleSlideshowPrev} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button 
            onClick={handleSlideshowNext} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          {/* 底部控制栏 */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="max-w-7xl mx-auto">
              {/* 图片信息 */}
              {getSlideshowImages()[slideshowIndex] && (
                <div className="text-center mb-4">
                  <p className="text-white font-medium">{getSlideshowImages()[slideshowIndex].file_name}</p>
                  {getSlideshowImages()[slideshowIndex].tags && (
                    <div className="flex justify-center gap-2 mt-2">
                      {getSlideshowImages()[slideshowIndex].tags.split(',').filter(t=>t).slice(0,5).map((tag, i) => (
                        <span key={i} className="text-xs bg-white/20 text-white/90 px-2 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 播放控制 */}
              <div className="flex justify-center items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                {/* 速度调整 */}
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-sm">速度:</span>
                  <select 
                    value={slideshowInterval} 
                    onChange={(e) => setSlideshowInterval(Number(e.target.value))}
                    className="bg-white/20 text-white border-none rounded px-2 py-1 text-sm focus:ring-2 focus:ring-white/30"
                  >
                    <option value={1000}>1秒</option>
                    <option value={2000}>2秒</option>
                    <option value={3000}>3秒</option>
                    <option value={5000}>5秒</option>
                    <option value={10000}>10秒</option>
                  </select>
                </div>
              </div>

              {/* 缩略图预览 */}
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto py-2">
                {getSlideshowImages().map((img, idx) => (
                  <button 
                    key={img.ID}
                    onClick={() => setSlideshowIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === slideshowIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={getImageUrl(img.thumbnail_url || img.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
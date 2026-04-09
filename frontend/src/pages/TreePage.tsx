import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "motion/react";
import { 
  CheckCircle2, 
  Clock, 
  Lock, 
  RotateCcw, 
  Layout as LayoutIcon, 
  Save,
  Info,
  Undo2,
  Redo2,
  X,
  User,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../App";

// --- Custom Node ---
const SemesterGroupNode = ({ data }: any) => {
  return (
    <div className="w-full h-full border-2 border-zinc-200 rounded-3xl bg-zinc-50/30 pointer-events-none relative">
      {/* Label - Positioned to the left outside the box */}
      <div className="absolute top-0 -left-40 w-36 h-full flex flex-col justify-center items-end pr-4 pointer-events-none">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">{data.year}</span>
        <span className="text-sm font-bold text-zinc-500 text-right">{data.label}</span>
      </div>

      {/* Slot Grid Background - Visual Boxes */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ 
             backgroundImage: `
               linear-gradient(to right, #000 1px, transparent 1px),
               linear-gradient(to bottom, #000 1px, transparent 1px)
             `,
             backgroundSize: '180px 150px',
             backgroundPosition: '0px 0px'
           }} 
      />
      
      {/* Slot Placeholders - Centered in 180x150 slots */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'180\' height=\'150\' viewBox=\'0 0 180 150\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'10\' y=\'15\' width=\'160\' height=\'120\' rx=\'12\' fill=\'black\'/%3E%3C/svg%3E")',
             backgroundSize: '180px 150px',
             backgroundPosition: '0px 0px'
           }}
      />
    </div>
  );
};

const CourseNode = ({ data }: any) => {
  const categoryColors = {
    university: "bg-[#FFFF99] border-[#E6E600] text-zinc-900",
    faculty: "bg-[#FFF9E6] border-[#F2E6B3] text-zinc-900",
    discipline: "bg-[#FFCC99] border-[#FF9933] text-zinc-900",
    program: "bg-[#C2E0C2] border-[#85C285] text-zinc-900",
  };

  const statusColors = {
    completed: "ring-2 ring-emerald-500/50 grayscale-[0.3] brightness-95",
    in_progress: "ring-4 ring-blue-500/50 scale-[1.02] z-10",
    not_taken: "border-zinc-300",
  };

  const statusIcons = {
    completed: <CheckCircle2 size={14} className="text-emerald-700" />,
    in_progress: <Clock size={14} className="text-blue-600 animate-pulse" />,
    not_taken: null,
  };

  let mappedCategory = 'program';
  if (data.category) {
    const rawMatch = data.category.toLowerCase();
    if (rawMatch.includes('university')) mappedCategory = 'university';
    else if (rawMatch.includes('faculty')) mappedCategory = 'faculty';
    else if (rawMatch.includes('basic') || rawMatch.includes('discipline')) mappedCategory = 'discipline';
  }

  const category = (mappedCategory as keyof typeof categoryColors) || 'program';
  const status = (data.status as keyof typeof statusColors) || 'not_taken';
  const isHighlighted = data.highlighted;

  return (
    <div className="w-[180px] h-[150px] px-[10px] py-[15px] flex items-center justify-center">
      <div 
        className={`w-full h-full px-3 py-2 rounded-lg border-2 shadow-sm flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${categoryColors[category]} ${statusColors[status]} ${isHighlighted ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105 z-50' : ''}`}
      >
        {/* Slashed/Hashed effect for completed courses - More prominent */}
        {status === 'completed' && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #000 8px, #000 10px)',
            }}
          />
        )}

        <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-2 !h-2" />
        
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-bold uppercase tracking-tight opacity-70">{data.code}</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold opacity-70">{data.credit_hours}</span>
            {statusIcons[status]}
          </div>
        </div>
        
        <div className="text-[11px] font-bold leading-tight text-center flex-grow flex items-center justify-center">
          {data.name}
        </div>

        <div className="flex items-center justify-center pt-1 border-t border-black/5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              data.onStatusChange(data.id);
            }}
            className="text-[8px] font-bold hover:underline uppercase tracking-tighter opacity-60"
          >
            Change Status
          </button>
        </div>

        <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-2 !h-2" />
      </div>
    </div>
  );
};

const nodeTypes = {
  courseNode: CourseNode,
  semesterGroup: SemesterGroupNode,
};

const SEMESTERS = [
  { id: 'year1', label: 'Freshman', year: 'Freshman' },
  { id: 'year2', label: 'Sophomore', year: 'Sophomore' },
  { id: 'year3', label: 'Junior', year: 'Junior' },
  { id: 'year4', label: 'Senior', year: 'Senior' }
];

export default function TreePage() {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptId, setDeptId] = useState<number | null>(null);
  const [userStatuses, setUserStatuses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedNodeOriginal, setDraggedNodeOriginal] = useState<{ id: string, parentId: string, position: { x: number, y: number } } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Course Details State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Undo/Redo State
  const [history, setHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveLayout = useCallback(async (nodesToSave?: any[], silent = false) => {
    const targetNodes = nodesToSave || nodes;
    if (!user || targetNodes.length === 0) return;
    
    if (!silent) setSaving(true);
    try {
      const { supabase } = await import("../lib/supabase");
      const courseNodes = targetNodes.filter(n => n.type === 'courseNode');
      
      const upsertData = courseNodes.map(node => {
        const yearId = node.parentId?.replace('year', '');
        const yOffset = node.position.y;
        const isSpring = yOffset >= 75; // 0 for row1, 150 for row2, halfway threshold is 75
        const sem = yearId ? (parseInt(yearId) - 1) * 2 + (isSpring ? 2 : 1) : null;
        
        return {
          user_id: user.id,
          course_id: parseInt(node.id),
          x: node.position.x,
          y: node.position.y,
          semester: sem
        };
      });

      const { error } = await supabase.from('user_layouts').upsert(upsertData);
      if (error) throw error;

      if (!silent) alert("Layout saved successfully!");
    } catch (e) {
      console.error(e);
      if (!silent) alert("Failed to save layout.");
    } finally {
      if (!silent) setSaving(false);
    }
  }, [user, nodes]);

  const pushToHistory = useCallback((newNodes: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newNodes)));
    // Limit history size
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevNodes = JSON.parse(JSON.stringify(history[prevIndex]));
      setNodes(prevNodes);
      setHistoryIndex(prevIndex);
      saveLayout(prevNodes, true);
    }
  }, [history, historyIndex, setNodes, saveLayout]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextNodes = JSON.parse(JSON.stringify(history[nextIndex]));
      setNodes(nextNodes);
      setHistoryIndex(nextIndex);
      saveLayout(nextNodes, true);
    }
  }, [history, historyIndex, setNodes, saveLayout]);

  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    
    const highlighted = new Set<string>();
    const stack = [hoveredNodeId];
    
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      // Find all edges where this node is the target (to find its prerequisites)
      const incomingEdges = edges.filter(e => e.target === currentId);
      incomingEdges.forEach(edge => {
        if (!highlighted.has(edge.source)) {
          highlighted.add(edge.source);
          stack.push(edge.source);
        }
      });
    }
    
    return highlighted;
  }, [hoveredNodeId, edges]);

  const fetchTree = useCallback(async () => {
    if (!deptId) return;
    setLoading(true);
    const { supabase } = await import("../lib/supabase");
    
    const { data: progCourses } = await supabase
      .from('program_courses')
      .select(`
        semester,
        courses (
          id, code, name, credit_hours, category
        )
      `)
      .eq('program_id', deptId);

    if (!progCourses || progCourses.length === 0) {
      setNodes([]);
      setEdges([]);
      setLoading(false);
      return;
    }

    const courses = progCourses.map((pc: any) => ({
      ...pc.courses,
      semester: pc.semester
    }));
    
    const courseIds = courses.map(c => c.id);
    const { data: prereqs } = await supabase.from('prerequisites').select('*').in('course_id', courseIds);

    let userCourses: any[] = [];
    let userLayouts: any[] = [];
    if (user) {
      const [uC, uL] = await Promise.all([
        supabase.from('user_courses').select('*').eq('user_id', user.id),
        supabase.from('user_layouts').select('*').eq('user_id', user.id)
      ]);
      userCourses = uC.data || [];
      userLayouts = uL.data || [];
    }
    
    const statusRes = userCourses;
    const layoutRes = userLayouts;
    
    // Map user data
    const statusMap: Record<number, string> = {};
    statusRes.forEach((s: any) => statusMap[s.course_id] = s.status);
    setUserStatuses(statusMap);

    const layoutMap: Record<number, any> = {};
    layoutRes.forEach((l: any) => layoutMap[l.course_id] = l);

    // Double-row configurations per bucket
    const levelWidth = 1440; 
    const levelHeight = 300; // precisely 2 rows of 150px
    const gap = 80;

    // Level Group Nodes
    const groupNodes = SEMESTERS.map((sem, i) => ({
      id: sem.id,
      type: 'semesterGroup',
      position: { x: 0, y: i * (levelHeight + gap) },
      style: { width: levelWidth, height: levelHeight },
      data: { label: sem.label, year: sem.year },
      draggable: false,
    }));

    // Course Nodes
    const courseNodes = courses.map((c: any) => {
      const savedLayout = layoutMap[c.id];
      let semIndex = savedLayout?.semester !== undefined ? savedLayout.semester : (c.semester || 1);
      // Cap semester between 1 and 8
      if (semIndex < 1) semIndex = 1;
      if (semIndex > 8) semIndex = 8;
      
      const yearIndex = Math.floor((semIndex - 1) / 2); // 0, 1, 2, 3
      const levelId = `year${yearIndex + 1}`;
      
      let position = { x: 0, y: 0 };
      if (savedLayout && savedLayout.x !== undefined) {
        position = { x: savedLayout.x, y: savedLayout.y };
      } else {
        const isSpring = (semIndex - 1) % 2 === 1; // row 1
        const row = isSpring ? 1 : 0;
        
        const coursesInSemester = courses.filter((curr: any) => curr.semester === semIndex);
        const indexInSemester = coursesInSemester.findIndex((curr: any) => curr.id === c.id);
        const col = indexInSemester;
        
        position = { x: col * 180, y: row * 150 };
      }

      return {
        id: c.id.toString(),
        type: "courseNode",
        parentId: levelId,
        position,
        // extent: 'parent', // REMOVED to allow cross-level dragging
        data: { 
          ...c, 
          status: statusMap[c.id] || 'not_taken',
          onStatusChange: handleStatusChange,
          highlighted: false // Will be updated by useEffect
        }
      };
    });

    const initialEdges = prereqs.map((p: any) => ({
      id: `e${p.prerequisite_id}-${p.course_id}`,
      source: p.prerequisite_id.toString(),
      target: p.course_id.toString(),
      animated: false,
      style: { stroke: '#CBD5E1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#CBD5E1' }
    }));

    setNodes([...groupNodes, ...courseNodes]);
    setEdges(initialEdges);
    setLoading(false);
    
    // Initialize history
    if (history.length === 0) {
      setHistory([[...groupNodes, ...courseNodes]]);
      setHistoryIndex(0);
    }
  }, [deptId, user]);

  // Fetch Departments
  useEffect(() => {
    const fetchDepts = async () => {
      const { supabase } = await import("../lib/supabase");
      const { data } = await supabase.from('departments').select('*').order('name');
      if (data && data.length > 0) {
        setDepartments(data);
        // Default to a common program or the first one if none matches perfectly
        const defaultDept = data.find(d => d.name === 'CSE') || data.find(d => d.name === 'MDPE') || data[0];
        setDeptId(defaultDept.id);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (deptId) {
      fetchTree();
    }
  }, [fetchTree, deptId]);

  // Fetch Course Details
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const { supabase } = await import("../lib/supabase");
        const [
          { data: cData },
          { data: prefData }
        ] = await Promise.all([
           supabase.from('courses').select('*').eq('id', selectedCourseId).single(),
           supabase.from('course_professors').select('professors(id, name, reviews(difficulty, recommend))').eq('course_id', selectedCourseId)
        ]);
        
        const processedProfessors = prefData?.map((cp: any) => {
           const revs = cp.professors.reviews || [];
           const recs = revs.filter((r:any) => r.recommend).length;
           return {
             ...cp.professors,
             recommend_percent: revs.length ? (recs / revs.length)*100 : null,
             avg_difficulty: revs.length ? (revs.reduce((a:number, r:any) => a+r.difficulty, 0)/revs.length) : null
           };
        }) || [];
        
        setCourseDetails({ ...cData, professors: processedProfessors });
      } catch (e) {
        console.error(e);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedCourseId]);

  const handleStatusChange = useCallback(async (courseId: number) => {
    const statuses = ['not_taken', 'in_progress', 'completed'];
    
    setUserStatuses(prev => {
      const current = prev[courseId] || 'not_taken';
      const normalizedCurrent = statuses.includes(current) ? current : 'not_taken';
      const nextIndex = (statuses.indexOf(normalizedCurrent) + 1) % statuses.length;
      const next = statuses[nextIndex];
      
      // Trigger API call in background
      if (user) {
        import("../lib/supabase").then(({ supabase }) => {
          supabase.from('user_courses').upsert({ user_id: user.id, course_id: courseId, status: next })
            .then(({ error }) => { if (error) console.error("Failed to save status:", error) });
        });
      }
      
      return { ...prev, [courseId]: next };
    });
  }, [user]);

  // Logic to update highlighting and status in nodes
  useEffect(() => {
    if (nodes.length === 0) return;

    const updatedNodes = nodes.map(node => {
      if (node.type !== 'courseNode') return node;

      const courseId = parseInt(node.id);
      const status = userStatuses[courseId] || 'not_taken';
      const isHighlighted = highlightedNodeIds.has(node.id);

      return {
        ...node,
        data: { 
          ...node.data, 
          status, 
          highlighted: isHighlighted,
          onStatusChange: handleStatusChange // Ensure latest function ref
        }
      };
    });

    // Only update if something actually changed to avoid infinite loop
    const hasChanged = updatedNodes.some((node, i) => 
      node.data?.status !== nodes[i].data?.status || 
      node.data?.highlighted !== nodes[i].data?.highlighted ||
      node.data?.onStatusChange !== nodes[i].data?.onStatusChange
    );
    if (hasChanged) {
      setNodes(updatedNodes);
    }
  }, [userStatuses, nodes.length, highlightedNodeIds, handleStatusChange]);

  // Update edge styles based on highlighting
  const styledEdges = useMemo(() => {
    return edges.map(edge => {
      const isHighlighted = highlightedNodeIds.has(edge.source) && 
                           (highlightedNodeIds.has(edge.target) || edge.target === hoveredNodeId);
      
      return {
        ...edge,
        animated: isHighlighted,
        style: { 
          stroke: isHighlighted ? '#F59E0B' : '#CBD5E1', 
          strokeWidth: isHighlighted ? 3 : 2,
          transition: 'all 0.3s ease'
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: isHighlighted ? '#F59E0B' : '#CBD5E1' 
        }
      };
    });
  }, [edges, highlightedNodeIds, hoveredNodeId]);

  const autoArrange = () => {
    fetchTree();
  };

  const onNodeDragStart = useCallback((_event: any, node: any) => {
    if (node.type === 'courseNode') {
      setDraggedNodeOriginal({ 
        id: node.id, 
        parentId: node.parentId || '', 
        position: { ...node.position } 
      });
    }
  }, []);

  const onNodeDragStop = useCallback((_event: any, node: any) => {
    if (node.type !== 'courseNode' || !draggedNodeOriginal) return;

    // Find which level group the node is over
    const droppedIn = SEMESTERS.find(sem => {
      const groupNode = nodes.find(n => n.id === sem.id);
      if (!groupNode) return false;
      
      // Calculate absolute position of the node
      const parentNode = node.parentId ? nodes.find(n => n.id === node.parentId) : null;
      const nodeAbsoluteX = node.position.x + (parentNode?.position.x || 0);
      const nodeAbsoluteY = node.position.y + (parentNode?.position.y || 0);

      const groupX = groupNode.position.x;
      const groupY = groupNode.position.y;
      const groupWidth = groupNode.style?.width as number || 1080;
      const groupHeight = groupNode.style?.height as number || 240;

      return (
        nodeAbsoluteX >= groupX &&
        nodeAbsoluteX <= groupX + groupWidth &&
        nodeAbsoluteY >= groupY &&
        nodeAbsoluteY <= groupY + groupHeight
      );
    });

    if (droppedIn) {
      const groupNode = nodes.find(gn => gn.id === droppedIn.id);
      const parentNode = node.parentId ? nodes.find(p => p.id === node.parentId) : null;
      
      const nodeAbsoluteX = node.position.x + (parentNode?.position.x || 0);
      const nodeAbsoluteY = node.position.y + (parentNode?.position.y || 0);
      
      const targetX = nodeAbsoluteX - (groupNode?.position.x || 0);
      const targetY = nodeAbsoluteY - (groupNode?.position.y || 0);

      // Snap to grid
      const snappedX = Math.round(targetX / 180) * 180;
      const snappedY = Math.round(targetY / 150) * 150;

      // Find if there's a node already in this slot
      const existingNode = nodes.find(n => 
        n.type === 'courseNode' && 
        n.id !== node.id && 
        n.parentId === droppedIn.id && 
        Math.abs(n.position.x - snappedX) < 10 && 
        Math.abs(n.position.y - snappedY) < 10
      );

      const nextNodes = nodes.map(n => {
        if (n.id === node.id) {
          return { 
            ...n, 
            parentId: droppedIn.id, 
            position: { x: snappedX, y: snappedY } 
          };
        }
        if (existingNode && n.id === existingNode.id) {
          // Swap: Move existing node to where the dragged node CAME FROM
          return { 
            ...n, 
            parentId: draggedNodeOriginal.parentId, 
            position: draggedNodeOriginal.position 
          };
        }
        return n;
      });

      setNodes(nextNodes);
      pushToHistory(nextNodes);
      saveLayout(nextNodes, true); // Silent save on drag stop
    }
    setDraggedNodeOriginal(null);
  }, [nodes, setNodes, draggedNodeOriginal, saveLayout, pushToHistory]);

  const onNodeClick = useCallback((_event: any, node: any) => {
    if (node.type === 'courseNode') {
      setSelectedCourseId(node.id);
    }
  }, []);

  const onNodeMouseEnter = useCallback((_event: any, node: any) => {
    if (node.type === 'courseNode') {
      setHoveredNodeId(node.id);
    }
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-zinc-50 relative">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={nodeTypes}
          snapToGrid={true}
          snapGrid={[180, 150]}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#E2E8F0" gap={20} />
          <Controls />
          
          <Panel position="top-left" className="bg-white rounded-2xl border border-zinc-200 shadow-xl flex transition-all duration-300 relative">
            <motion.div 
              initial={false}
              animate={{ width: isPanelOpen ? '320px' : '0px', opacity: isPanelOpen ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 w-[320px] space-y-4">
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Course Tree Planner</h2>
                    <p className="text-xs text-zinc-500">Faculty of Engineering, Ain Shams University</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Program</label>
                    <select 
                      value={deptId || ''} 
                      onChange={(e) => setDeptId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-zinc-800 transition-colors cursor-pointer"
                    >
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={autoArrange}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    <LayoutIcon size={14} /> Auto Arrange
                  </button>
                  <button 
                    onClick={fetchTree}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Undo2 size={14} /> Undo
                  </button>
                  <button 
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Redo2 size={14} /> Redo
                  </button>
                </div>

                <div className="pt-4 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                    <div className="w-3 h-3 rounded bg-[#FFFF99] border border-[#E6E600]" /> University
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                    <div className="w-3 h-3 rounded bg-[#FFF9E6] border border-[#F2E6B3]" /> Faculty
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                    <div className="w-3 h-3 rounded bg-[#FFCC99] border border-[#FF9933]" /> Discipline
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                    <div className="w-3 h-3 rounded bg-[#C2E0C2] border border-[#85C285]" /> Program
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                    <div className="w-3 h-3 rounded bg-white border-2 border-emerald-500/50 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 3px)' }} />
                    </div> Completed (Slashed)
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                    <div className="w-3 h-3 rounded ring-2 ring-blue-500/50" /> In Progress
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                    <div className="w-3 h-3 rounded border border-zinc-300" /> Planned (Default)
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl flex gap-3">
                  <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      Click "Change Status" to update progress.
                    </p>
                    <p className="text-[10px] text-emerald-800 leading-relaxed font-bold">
                      Drag courses between semesters to customize your plan.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Toggle Button - Smaller and floating on the edge */}
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-white border border-zinc-200 shadow-lg rounded-r-xl flex items-center justify-center text-zinc-400 hover:text-emerald-600 transition-colors z-50"
            >
              {isPanelOpen ? <X size={16} /> : <LayoutIcon size={16} />}
            </button>
          </Panel>

          <Panel position="bottom-right">
             <button 
               onClick={saveLayout}
               disabled={saving || !user}
               className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold shadow-xl hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Save size={18} className={saving ? "animate-pulse" : ""} />
                {saving ? "Saving..." : user ? "Save My Layout" : "Sign in to Save"}
             </button>
          </Panel>
        </ReactFlow>
      )}

      {/* Course Detail Side Panel */}
      {selectedCourseId && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="absolute top-0 right-0 w-full sm:w-80 h-full bg-white border-l border-zinc-200 shadow-2xl z-[60] flex flex-col"
        >
          <div className="p-6 flex justify-between items-center border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900">Course Details</h3>
            <button 
              onClick={() => setSelectedCourseId(null)}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X size={20} className="text-zinc-500" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {detailsLoading ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-4">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-zinc-400 font-medium">Loading details...</p>
              </div>
            ) : courseDetails ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                      {courseDetails.code}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">
                      {courseDetails.credit_hours} Credit Hours
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 leading-tight">
                    {courseDetails.name}
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <BookOpen size={16} className="text-emerald-500" />
                    Description
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {courseDetails.description || "No description available for this course yet."}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <User size={16} className="text-blue-500" />
                    Professors
                  </div>
                  <div className="space-y-2">
                    {courseDetails.professors && courseDetails.professors.length > 0 ? (
                      courseDetails.professors.map((p: any) => (
                        <div key={p.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                          <p className="text-sm font-bold text-zinc-800">{p.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-zinc-500">⭐ {p.recommend_percent?.toFixed(0) || 0}% Recommend</span>
                            <span className="text-[10px] text-zinc-500">📊 {p.avg_difficulty?.toFixed(1) || 0} Difficulty</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-400 italic">No professors assigned yet.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <Lock size={16} className="text-amber-500" />
                    Prerequisites
                  </div>
                  <div className="space-y-2">
                    {edges.filter(e => e.target === selectedCourseId).length > 0 ? (
                      edges.filter(e => e.target === selectedCourseId).map(e => {
                        const prereqNode = nodes.find(n => n.id === e.source);
                        return (
                          <div key={e.id} className="flex items-center gap-2 p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                            <ArrowRight size={12} className="text-amber-500" />
                            <span className="text-xs font-bold text-amber-900">{prereqNode?.data.code}</span>
                            <span className="text-xs text-amber-800 truncate">{prereqNode?.data.name}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-zinc-400 italic">No prerequisites required.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-zinc-400">Failed to load course details.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

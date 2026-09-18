import { useNavigate } from 'react-router-dom';
import { FaVideo, FaArrowRight } from 'react-icons/fa';
import MissionForm from '../components/MissionForm';

const RealtimeSetup = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 flex-wrap">
          <FaVideo className="text-cyan-400" /> Realtime Detection
        </h1>
        <p className="text-sm text-white/50 mono mt-1">
          Set up a mission before streaming live sonar input
        </p>
      </div>

      <MissionForm
        sourceType="realtime"
        submitLabel="Create Mission & Start Realtime"
        onCreated={(missionId) => navigate(`/realtime/${missionId}`)}
      />

      <button
        onClick={() => navigate('/missions')}
        className="w-full py-3 rounded-xl glass border border-white/10 text-sm hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center gap-2 transition"
      >
        Back to Mission History <FaArrowRight className="text-[10px]" />
      </button>
    </div>
  );
};

export default RealtimeSetup;
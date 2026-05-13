function VotingPage() {

  const candidates = [
    {
      id: 1,
      name: "Sarah Mokoena",
      party: "Democratic Alliance",
      color: "bg-blue-600"
    },

    {
      id: 2,
      name: "Thabo Nkosi",
      party: "African National Congress",
      color: "bg-green-600"
    },

    {
      id: 3,
      name: "Lerato Dlamini",
      party: "Economic Freedom Fighters",
      color: "bg-red-600"
    }
  ];

  return (

    <div className="min-h-screen bg-slate-100">

      <nav className="bg-slate-900 text-white px-8 py-5 flex flex-col md:flex-row justify-between items-center shadow-xl">

      <h1 className="text-3xl font-bold text-cyan-400 mb-4 md:mb-0">
        E-Vote Commission  
        </h1>



        <div className="flex flex-wrap gap-6 text-lg">

          <a href="/elections"
          className="hover:text-cyan-400 transition">
              Elections
              </a>

               <a href="/voters"
          className="hover:text-cyan-400 transition">
              Voters
              </a>

               <a href="/candidates"
          className="hover:text-cyan-400 transition">
              Candidates
              </a>

               <a href="/vote"
          className="hover:text-cyan-400 transition">
             Vote
              </a>

             </div>

            </nav>

      <div className="bg-slate-900 text-white p-8 shadow-xl">

        <h1 className="text-3xl md:text-5xl font-bold mb-3">
          National Voting Dashboard
        </h1>

        <p className="text-xl text-slate-300">
          Secure Electronic Voting Platform
        </p>

      </div>

    
      <div className="p-8">

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">

          <h2 className="text-4xl font-bold text-slate-800 mb-5">
            Welcome Voter
          </h2>

          <p className="text-xl text-slate-600 leading-8">
           Please review the candidates below and cast your secure electronic vote.
           </p>

        </div>

      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

          <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl">

            <h3 className="text-2xl mb-3">
              Registered Voters
            </h3>

            <p className="text-5xl font-bold">
              12,540
            </p>

          </div>

          <div className="bg-green-600 text-white p-8 rounded-3xl shadow-xl">

            <h3 className="text-2xl mb-3">
              Votes Cast
            </h3>

            <p className="text-5xl font-bold">
              10,240
            </p>

          </div>

          <div className="bg-amber-500 text-white p-8 rounded-3xl shadow-xl">

            <h3 className="text-2xl mb-3">
              Remaining Voters
            </h3>

            <p className="text-5xl font-bold">
              2,300
            </p>

          </div>

        </div>
      

        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8">
          Candidates
        </h2>

       <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8">
  Candidates
</h2>

<div className="grid grid-cols-1 md:grid-cols-3 gap-8">

  {candidates.map((candidate) => (

    <div
      key={candidate.id}
      className="bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition duration-300"
    >

      <div className={`${candidate.color} h-52 flex items-center justify-center`}>

        <img
          src="https://via.placeholder.com/150"
          alt="Candidate"
          className="w-32 h-32 rounded-full border-4 border-white object-cover"
        />

      </div>

      <div className="p-8">

        <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
          {candidate.name}
        </h3>

        <p className="text-xl text-slate-500 mb-8">
          {candidate.party}
        </p>

        <div className="mt-6">

          <button
            onClick={() => alert("Your vote has been submitted successfully!")}
            className="w-full bg-slate-900 hover:bg-slate-700 text-white py-4 rounded-2xl text-xl font-semibold transition"
          >
            Vote Candidate
          </button>

          <p className="text-center text-slate-500 mt-4">
            Your vote will remain secure and confidential.
          </p>

        </div>

      </div>

    </div>

  ))}

</div>

</div>

</div> 
   
        
  );
}

export default VotingPage;

/**
 * The only component that will talk to the application layer.
 * In M0 it renders a placeholder so the view can be opened on every device.
 */
export function HomeScreen() {
	return (
		<main className="dromos-home">
			<header className="dromos-header">
				<h1 className="dromos-title">Dromos</h1>
				<p className="dromos-subtitle">La carrera empieza aquí.</p>
			</header>
			<section className="dromos-panel">
				<p>El personaje, las quests y las campañas llegan en el siguiente tramo.</p>
			</section>
		</main>
	);
}
